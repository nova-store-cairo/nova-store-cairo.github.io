// =====================================================
// NOVA — EDIT MODE
// When the shop owner is logged in, they can change the store
// right here on the page:
//   • click any headline or text → type → it saves by itself
//   • right-click a product → edit, change photo, or delete
//   • right-click the big photo → change it
//   • "+ Add product" tile at the end of the collection
// Visitors never see any of this, and the database rules
// block anyone who is not an admin anyway.
// =====================================================

(function () {
  const BUCKET = "product-images";
  let editing = false;
  let menuEl = null;

  // ===== 1. Only start for a logged-in admin =====
  async function start() {
    const { data } = await db.auth.getSession();
    const session = data.session;
    if (!session) return; // a normal visitor: do nothing

    const { data: adminRow } = await db
      .from("admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!adminRow) return; // logged in, but not an owner

    buildEditBar();
    // Edit mode is ON by default for the owner; they can switch it off
    setEditing(sessionStorage.getItem("nova-edit-off") !== "1");
  }

  // ===== 2. The floating bar at the bottom =====
  function buildEditBar() {
    const bar = document.createElement("div");
    bar.className = "edit-bar";
    bar.innerHTML = `
      <span class="edit-bar-text">
        <strong>Editing your store.</strong>
        <span class="edit-bar-hint">Click a text to change it. Right-click a product or photo for more.</span>
      </span>
      <button type="button" class="edit-bar-btn" id="edit-add">Add product</button>
      <button type="button" class="edit-bar-btn edit-bar-main" id="edit-toggle">Done</button>
      <a class="edit-bar-link" href="admin.html">Admin</a>
    `;
    document.body.appendChild(bar);

    bar.querySelector("#edit-toggle").addEventListener("click", function () {
      setEditing(!editing);
    });
    bar.querySelector("#edit-add").addEventListener("click", function () {
      openProductDialog(null);
    });
  }

  function setEditing(on) {
    editing = on;
    document.body.classList.toggle("is-editing", on);
    sessionStorage.setItem("nova-edit-off", on ? "0" : "1");

    const toggle = document.querySelector("#edit-toggle");
    toggle.textContent = on ? "Done" : "Edit store";
    document.querySelector(".edit-bar").classList.toggle("is-collapsed", !on);

    // Texts become typeable only while editing
    document.querySelectorAll("[data-edit-key]").forEach(function (el) {
      el.contentEditable = on ? "true" : "false";
      el.spellcheck = on;
    });
    decorateProducts();
    closeMenu();
  }

  // ===== 3. Editing texts =====
  // Save when the owner clicks away; Enter = done; Esc = undo.
  document.addEventListener("focusin", function (event) {
    const el = event.target.closest("[data-edit-key]");
    if (!editing || !el) return;
    el.dataset.before = el.textContent;
  });

  document.addEventListener("keydown", function (event) {
    const el = event.target.closest && event.target.closest("[data-edit-key]");
    if (!editing || !el) return;
    if (event.key === "Enter") {
      event.preventDefault();
      el.blur();
    }
    if (event.key === "Escape") {
      el.textContent = el.dataset.before || el.textContent;
      el.blur();
    }
  });

  document.addEventListener(
    "focusout",
    async function (event) {
      const el = event.target.closest && event.target.closest("[data-edit-key]");
      if (!editing || !el) return;

      const value = el.textContent.trim();
      if (value === (el.dataset.before || "").trim()) return; // nothing changed
      if (value === "") {
        el.textContent = el.dataset.before;
        toast("A text can't be empty.");
        return;
      }
      el.textContent = value;
      await saveSetting(el.dataset.editKey, value);
    },
    true
  );

  // While editing, clicking the button text must not jump to the products
  document.addEventListener(
    "click",
    function (event) {
      if (editing && event.target.closest("a[data-edit-key]")) event.preventDefault();
    },
    true
  );

  async function saveSetting(key, value) {
    const { error } = await db
      .from("site_settings")
      .upsert({ key: key, value: value, updated_at: new Date().toISOString() });
    if (error) {
      console.error(error);
      toast("Couldn't save. Check your connection and try again.");
      return false;
    }
    SITE[key] = value;
    toast("Saved");
    return true;
  }

  // ===== 4. Right-click menus =====
  document.addEventListener("contextmenu", function (event) {
    if (!editing) return;

    const card = event.target.closest(".card[data-id]");
    const heroImage = event.target.closest("#hero-image");

    if (card) {
      event.preventDefault();
      const product = findProduct(Number(card.dataset.id));
      openMenu(event.clientX, event.clientY, product.name, [
        { label: "Edit details…", run: () => openProductDialog(product) },
        { label: "Change photo…", run: () => pickPhoto((url) => updateProduct(product.id, { image: url })) },
        { label: "Delete product", danger: true, run: () => deleteProduct(product) }
      ]);
    } else if (heroImage) {
      event.preventDefault();
      openMenu(event.clientX, event.clientY, "Main photo", [
        { label: "Change photo…", run: () => pickPhoto(changeHeroPhoto) }
      ]);
    }
    // Anywhere else: the normal browser menu
  });

  function openMenu(x, y, title, items) {
    closeMenu();
    menuEl = document.createElement("div");
    menuEl.className = "edit-menu";
    menuEl.setAttribute("role", "menu");
    menuEl.innerHTML =
      `<p class="edit-menu-title"></p>` +
      items
        .map(
          (item, i) =>
            `<button type="button" role="menuitem" data-i="${i}" class="${item.danger ? "is-danger" : ""}">${item.label}</button>`
        )
        .join("");
    menuEl.querySelector(".edit-menu-title").textContent = title;
    document.body.appendChild(menuEl);

    // Keep the menu inside the screen
    const box = menuEl.getBoundingClientRect();
    menuEl.style.left = Math.min(x, window.innerWidth - box.width - 8) + "px";
    menuEl.style.top = Math.min(y, window.innerHeight - box.height - 8) + "px";

    menuEl.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-i]");
      if (!button) return;
      const item = items[Number(button.dataset.i)];
      closeMenu();
      item.run();
    });
    menuEl.querySelector("button").focus();
  }

  function closeMenu() {
    if (menuEl) menuEl.remove();
    menuEl = null;
  }
  document.addEventListener("click", function (event) {
    if (menuEl && !menuEl.contains(event.target)) closeMenu();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });
  window.addEventListener("scroll", closeMenu, { passive: true });

  // ===== 5. Pencil buttons on tiles (for phones, where there is no right-click) =====
  function decorateProducts() {
    const grid = document.querySelector("#products");
    if (!grid) return;

    grid.querySelectorAll(".card[data-id]").forEach(function (card) {
      let pencil = card.querySelector(".edit-pencil");
      if (editing && !pencil) {
        pencil = document.createElement("button");
        pencil.type = "button";
        pencil.className = "edit-pencil";
        pencil.setAttribute("aria-label", "Edit this product");
        pencil.innerHTML = "✎";
        card.appendChild(pencil);
      }
      if (!editing && pencil) pencil.remove();
    });

    let addTile = grid.querySelector(".add-tile");
    if (editing && !addTile) {
      addTile = document.createElement("button");
      addTile.type = "button";
      addTile.className = "add-tile";
      addTile.innerHTML = "<span>+</span>Add product";
      addTile.addEventListener("click", () => openProductDialog(null));
      grid.appendChild(addTile);
    }
    if (!editing && addTile) addTile.remove();
  }

  // Tiles are redrawn whenever products load or a filter changes → decorate again
  const grid = document.querySelector("#products");
  new MutationObserver(function () {
    if (editing) decorateProducts();
  }).observe(grid, { childList: true });

  // The pencil opens the same menu as right-click
  grid.addEventListener(
    "click",
    function (event) {
      const pencil = event.target.closest(".edit-pencil");
      if (!pencil) return;
      event.stopPropagation(); // don't open the product sheet
      const rect = pencil.getBoundingClientRect();
      const card = pencil.closest(".card");
      const product = findProduct(Number(card.dataset.id));
      openMenu(rect.left, rect.bottom + 6, product.name, [
        { label: "Edit details…", run: () => openProductDialog(product) },
        { label: "Change photo…", run: () => pickPhoto((url) => updateProduct(product.id, { image: url })) },
        { label: "Delete product", danger: true, run: () => deleteProduct(product) }
      ]);
    },
    true
  );

  // ===== 6. Product details dialog (add or edit) =====
  function openProductDialog(product) {
    const existing = !!product;
    const dialog = document.createElement("div");
    dialog.className = "edit-dialog";
    dialog.innerHTML = `
      <form class="edit-dialog-box">
        <h3>${existing ? "Edit product" : "Add a product"}</h3>
        <label>Name <input name="name" required /></label>
        <div class="edit-row">
          <label>Price (${CUR}) <input name="price" type="number" min="0" step="1" required /></label>
          <label>Category <input name="category" list="edit-categories" placeholder="e.g. hoodies" required /></label>
        </div>
        <datalist id="edit-categories"></datalist>
        <label>Sizes <input name="sizes" placeholder="S, M, L, XL" required /></label>
        <label>Description <textarea name="description" rows="3"></textarea></label>
        <label>Photo <input name="photo" type="file" accept="image/*" /></label>
        <p class="edit-error"></p>
        <div class="edit-actions">
          <button type="button" class="edit-cancel">Cancel</button>
          <button type="submit" class="btn">${existing ? "Save changes" : "Add product"}</button>
        </div>
      </form>
    `;
    document.body.appendChild(dialog);

    const form = dialog.querySelector("form");
    const errorEl = dialog.querySelector(".edit-error");
    const saveBtn = dialog.querySelector('button[type="submit"]');

    // Suggest the categories that already exist
    const categories = [...new Set(products.map((p) => p.category))];
    dialog.querySelector("#edit-categories").innerHTML = categories
      .map((c) => `<option value="${c}"></option>`)
      .join("");

    if (existing) {
      form.name.value = product.name;
      form.price.value = product.price;
      form.category.value = product.category;
      form.sizes.value = product.sizes.join(", ");
      form.description.value = product.description || "";
    }
    form.name.focus();

    function close() {
      dialog.remove();
    }
    dialog.querySelector(".edit-cancel").addEventListener("click", close);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      errorEl.textContent = "";
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving…";

      try {
        const values = {
          name: form.name.value.trim(),
          price: Number(form.price.value),
          category: form.category.value.trim().toLowerCase(),
          sizes: form.sizes.value
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== ""),
          description: form.description.value.trim()
        };
        if (values.sizes.length === 0) throw new Error("Add at least one size, like S, M, L.");

        const file = form.photo.files[0];
        if (file) {
          values.image = await uploadPhoto(file);
        } else if (!existing) {
          values.image = "https://placehold.co/400x500?text=" + encodeURIComponent(values.name);
        }

        const result = existing
          ? await db.from("products").update(values).eq("id", product.id)
          : await db.from("products").insert(values);
        if (result.error) throw result.error;

        close();
        await loadProducts();
        toast(existing ? "Saved" : "Product added");
      } catch (error) {
        console.error(error);
        errorEl.textContent = error.message || "Couldn't save the product. Try again.";
        saveBtn.disabled = false;
        saveBtn.textContent = existing ? "Save changes" : "Add product";
      }
    });
  }

  // ===== 7. Photos =====
  function pickPhoto(onUploaded) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", async function () {
      const file = input.files[0];
      if (!file) return;
      try {
        toast("Uploading photo…", true);
        const url = await uploadPhoto(file);
        await onUploaded(url);
      } catch (error) {
        console.error(error);
        toast(error.message || "Couldn't upload the photo.");
      }
    });
    input.click();
  }

  async function uploadPhoto(file) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("This photo is over 5 MB. Choose a smaller one.");
    }
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-");
    const path = Date.now() + "-" + safeName;

    const { error } = await db.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function changeHeroPhoto(url) {
    if (await saveSetting("hero_image", url)) {
      document.querySelector("#hero-image").src = url;
    }
  }

  // ===== 8. Products: update and delete =====
  function findProduct(id) {
    return products.find((p) => p.id === id);
  }

  async function updateProduct(id, values) {
    const { error } = await db.from("products").update(values).eq("id", id);
    if (error) {
      console.error(error);
      toast("Couldn't save. Try again.");
      return;
    }
    await loadProducts();
    toast("Saved");
  }

  async function deleteProduct(product) {
    if (!confirm('Delete "' + product.name + '"? Customers won\'t see it anymore. This can\'t be undone.')) return;
    const { error } = await db.from("products").delete().eq("id", product.id);
    if (error) {
      console.error(error);
      toast("Couldn't delete. Try again.");
      return;
    }
    await loadProducts();
    toast("Deleted");
  }

  // ===== 9. Small message at the top ("Saved") =====
  let toastTimer;
  function toast(message, stay) {
    let el = document.querySelector(".edit-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "edit-toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    if (!stay) toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  start();
})();
