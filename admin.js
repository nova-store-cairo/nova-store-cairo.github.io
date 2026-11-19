// =====================================================
// NOVA Admin — owner login, orders and products
// =====================================================
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== 1. Find the elements on the page =====
const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const logoutBtn = document.querySelector("#logout-btn");
const refreshBtn = document.querySelector("#refresh-btn");
const ordersList = document.querySelector("#orders-list");

// NEW: tabs and products
const tabButtons = document.querySelectorAll(".tab-btn");
const tabOrders = document.querySelector("#tab-orders");
const tabProducts = document.querySelector("#tab-products");
const tabSales = document.querySelector("#tab-sales");
const productsAdminList = document.querySelector("#products-admin-list");
const newProductBtn = document.querySelector("#new-product-btn");
const productForm = document.querySelector("#product-form");
const pfTitle = document.querySelector("#pf-title");
const pfId = document.querySelector("#pf-id");
const pfName = document.querySelector("#pf-name");
const pfPrice = document.querySelector("#pf-price");
const pfCategory = document.querySelector("#pf-category");
const pfSizes = document.querySelector("#pf-sizes");
const pfDescription = document.querySelector("#pf-description");
const pfImage = document.querySelector("#pf-image");
const pfPreview = document.querySelector("#pf-preview");
const pfSave = document.querySelector("#pf-save");
const pfCancel = document.querySelector("#pf-cancel");
const pfError = document.querySelector("#pf-error");
const categoryList = document.querySelector("#category-list");

const STATUSES = ["new", "confirmed", "delivered", "cancelled"];
const IMAGE_BUCKET = "product-images";

let adminProducts = []; // the products shown in the Products tab

// ===== 2. Safety: never trust what customers typed =====
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ===== 3. Show login OR dashboard, depending on who is logged in =====
async function showCorrectView() {
  const { data } = await db.auth.getSession();
  const loggedIn = data.session !== null;

  loginView.hidden = loggedIn;
  dashboardView.hidden = !loggedIn;
  logoutBtn.hidden = !loggedIn;

  if (loggedIn) {
    loadOrders();
  }
}

// ===== 4. Log in =====
loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  loginError.textContent = "";

  const email = document.querySelector("#login-email").value;
  const password = document.querySelector("#login-password").value;

  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = "Wrong email or password.";
    return;
  }

  loginForm.reset();
  showCorrectView();
});

// ===== 5. Log out =====
logoutBtn.addEventListener("click", async function () {
  await db.auth.signOut();
  ordersList.innerHTML = "";
  productsAdminList.innerHTML = "";
  showCorrectView();
});

// ===== 6. Switch between the tabs =====
const tabs = { orders: tabOrders, products: tabProducts, sales: tabSales };

tabButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    tabButtons.forEach(function (b) {
      b.classList.remove("active");
    });
    button.classList.add("active");

    // Show the chosen tab, hide the others
    const chosen = button.dataset.tab;
    Object.keys(tabs).forEach(function (name) {
      tabs[name].hidden = name !== chosen;
    });

    if (chosen === "orders") loadOrders();
    if (chosen === "products") loadAdminProducts();
    if (chosen === "sales") loadSales();
  });
});

// =====================================================
// ORDERS
// =====================================================

// ===== 7. Load the orders (newest first) =====
async function loadOrders() {
  ordersList.innerHTML = '<p class="loading">Loading orders…</p>';

  const { data, error } = await db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    ordersList.innerHTML =
      '<p class="loading">Could not load orders. Is this account an admin?</p>';
    return;
  }

  renderStats(data);
  renderOrders(data);
}

// ===== 8. The numbers at the top =====
function renderStats(orders) {
  let revenue = 0;
  let newCount = 0;

  orders.forEach(function (order) {
    if (order.status !== "cancelled") revenue += order.total;
    if (order.status === "new") newCount += 1;
  });

  document.querySelector("#stat-orders").textContent = orders.length;
  document.querySelector("#stat-new").textContent = newCount;
  document.querySelector("#stat-revenue").textContent = revenue.toLocaleString();
}

// ===== 9. One card per order =====
function renderOrders(orders) {
  if (orders.length === 0) {
    ordersList.innerHTML = '<p class="loading">No orders yet.</p>';
    return;
  }

  ordersList.innerHTML = orders
    .map(function (order) {
      const date = new Date(order.created_at).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      });

      const items = order.items
        .map(function (item) {
          const size = item.size ? " (" + escapeHtml(item.size) + ")" : "";
          return `<li>${escapeHtml(item.name)}${size} — ${Number(item.price).toLocaleString()} EGP</li>`;
        })
        .join("");

      const options = STATUSES.map(function (s) {
        const selected = s === order.status ? "selected" : "";
        return `<option value="${s}" ${selected}>${s}</option>`;
      }).join("");

      return `
        <div class="order-card status-${escapeHtml(order.status)}">
          <div class="order-top">
            <strong>Order #${order.id}</strong>
            <span class="order-date">${date}</span>
            <select class="status-select" data-id="${order.id}">${options}</select>
          </div>
          <p><b>${escapeHtml(order.customer_name)}</b> ·
            <a href="tel:${escapeHtml(order.customer_phone)}">${escapeHtml(order.customer_phone)}</a></p>
          <p class="order-address">${escapeHtml(order.customer_address)}</p>
          <ul class="order-items">${items}</ul>
          <p class="order-total">Total: ${order.total.toLocaleString()} EGP</p>
        </div>
      `;
    })
    .join("");
}

// ===== 10. Change an order's status =====
ordersList.addEventListener("change", async function (event) {
  if (!event.target.classList.contains("status-select")) return;

  const id = Number(event.target.dataset.id);
  const status = event.target.value;

  const { error } = await db.from("orders").update({ status: status }).eq("id", id);

  if (error) {
    console.error(error);
    alert("Could not update the order. Please try again.");
  }
  loadOrders();
});

refreshBtn.addEventListener("click", loadOrders);

// =====================================================
// NEW: PRODUCTS
// =====================================================

// ===== 11. Load and list the products =====
async function loadAdminProducts() {
  productsAdminList.innerHTML = '<p class="loading">Loading products…</p>';

  const { data, error } = await db.from("products").select("*").order("id");

  if (error) {
    console.error(error);
    productsAdminList.innerHTML = '<p class="loading">Could not load products.</p>';
    return;
  }

  adminProducts = data;
  renderAdminProducts();
  fillCategorySuggestions();
}

function renderAdminProducts() {
  if (adminProducts.length === 0) {
    productsAdminList.innerHTML = '<p class="loading">No products yet. Add your first one!</p>';
    return;
  }

  productsAdminList.innerHTML = adminProducts
    .map(function (p) {
      return `
        <div class="product-row">
          <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" />
          <div class="product-row-info">
            <strong>${escapeHtml(p.name)}</strong>
            <span>${escapeHtml(p.category)} · ${p.price.toLocaleString()} EGP</span>
            <span class="muted">Sizes: ${p.sizes.map(escapeHtml).join(", ")}</span>
          </div>
          <div class="product-row-actions">
            <button class="filter-btn edit-btn" data-id="${p.id}">Edit</button>
            <button class="filter-btn delete-btn" data-id="${p.id}">Delete</button>
          </div>
        </div>
      `;
    })
    .join("");
}

// Suggest existing categories while typing (so "hoodies" isn't typed as "Hoodie")
function fillCategorySuggestions() {
  const categories = [];
  adminProducts.forEach(function (p) {
    if (!categories.includes(p.category)) categories.push(p.category);
  });
  categoryList.innerHTML = categories
    .map(function (c) {
      return `<option value="${escapeHtml(c)}"></option>`;
    })
    .join("");
}

// ===== 12. Open the form: empty (add) or filled in (edit) =====
function openProductForm(product) {
  productForm.reset();
  pfError.textContent = "";
  pfPreview.hidden = true;

  if (product) {
    pfTitle.textContent = "Edit product";
    pfId.value = product.id;
    pfName.value = product.name;
    pfPrice.value = product.price;
    pfCategory.value = product.category;
    pfSizes.value = product.sizes.join(", ");
    pfDescription.value = product.description || "";
    pfPreview.src = product.image;
    pfPreview.hidden = false;
  } else {
    pfTitle.textContent = "Add product";
    pfId.value = "";
  }

  productForm.hidden = false;
  productForm.scrollIntoView({ behavior: "smooth" });
}

function closeProductForm() {
  productForm.hidden = true;
  productForm.reset();
}

newProductBtn.addEventListener("click", function () {
  openProductForm(null);
});
pfCancel.addEventListener("click", closeProductForm);

// Show a preview as soon as a photo is chosen
pfImage.addEventListener("change", function () {
  const file = pfImage.files[0];
  if (!file) return;
  pfPreview.src = URL.createObjectURL(file);
  pfPreview.hidden = false;
});

// ===== 13. Upload a photo and get its public web address =====
async function uploadImage(file) {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("The photo is bigger than 5 MB. Please choose a smaller one.");
  }

  // A unique file name, e.g. "1732040000000-black-hoodie.jpg"
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-");
  const path = Date.now() + "-" + safeName;

  const { error } = await db.storage.from(IMAGE_BUCKET).upload(path, file);
  if (error) throw error;

  const { data } = db.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ===== 14. Save (add new or update existing) =====
productForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  pfError.textContent = "";
  pfSave.disabled = true;
  pfSave.textContent = "Saving…";

  try {
    const id = pfId.value ? Number(pfId.value) : null;
    const existing = adminProducts.find(function (p) {
      return p.id === id;
    });

    const product = {
      name: pfName.value.trim(),
      price: Number(pfPrice.value),
      category: pfCategory.value.trim().toLowerCase(),
      sizes: pfSizes.value
        .split(",")
        .map(function (s) {
          return s.trim();
        })
        .filter(function (s) {
          return s !== "";
        }),
      description: pfDescription.value.trim()
    };

    if (product.sizes.length === 0) {
      throw new Error("Please enter at least one size.");
    }

    // Photo: new upload → use it; editing without a new photo → keep the old one;
    // new product without a photo → a placeholder with the product's name
    const file = pfImage.files[0];
    if (file) {
      product.image = await uploadImage(file);
    } else if (existing) {
      product.image = existing.image;
    } else {
      product.image =
        "https://placehold.co/400x500?text=" + encodeURIComponent(product.name);
    }

    let result;
    if (existing) {
      result = await db.from("products").update(product).eq("id", id);
    } else {
      result = await db.from("products").insert(product);
    }
    if (result.error) throw result.error;

    closeProductForm();
    loadAdminProducts();
  } catch (error) {
    console.error(error);
    pfError.textContent = error.message || "Could not save the product.";
  } finally {
    pfSave.disabled = false;
    pfSave.textContent = "Save product";
  }
});

// ===== 15. Edit and Delete buttons on each product =====
productsAdminList.addEventListener("click", async function (event) {
  const id = Number(event.target.dataset.id);
  const product = adminProducts.find(function (p) {
    return p.id === id;
  });
  if (!product) return;

  if (event.target.classList.contains("edit-btn")) {
    openProductForm(product);
  }

  if (event.target.classList.contains("delete-btn")) {
    const sure = confirm('Delete "' + product.name + '"? This cannot be undone.');
    if (!sure) return;

    const { error } = await db.from("products").delete().eq("id", id);
    if (error) {
      console.error(error);
      alert("Could not delete the product.");
    }
    loadAdminProducts();
  }
});

// =====================================================
// NEW: SALES DASHBOARD
// =====================================================

const charts = {}; // the drawn charts, so we can redraw them on Refresh
const DAY = 24 * 60 * 60 * 1000; // one day in milliseconds

// "2026-11-19" for a date (in the computer's own time zone)
function dayKey(date) {
  return date.toLocaleDateString("en-CA");
}

// "+12% vs previous 7 days" — or nothing if there is nothing to compare
function changeText(now, before) {
  if (before === 0) return now > 0 ? "new this week" : "";
  const percent = Math.round(((now - before) / before) * 100);
  const sign = percent > 0 ? "▲ +" : percent < 0 ? "▼ " : "";
  return sign + percent + "% vs previous 7 days";
}

// Count how often each value appears: { "Black Hoodie": 12, ... }
function countBy(list, getKey) {
  const counts = {};
  list.forEach(function (item) {
    const key = getKey(item);
    if (key === undefined || key === null) return;
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

// ===== 16. Load the orders and calculate the numbers =====
async function loadSales() {
  const { data, error } = await db.from("orders").select("*");
  if (error) {
    console.error(error);
    alert("Could not load sales data.");
    return;
  }

  const now = Date.now();
  const orders = data.filter(function (o) {
    return o.status !== "cancelled";
  });

  // Orders from the last 7 days, and the 7 days before that
  const thisWeek = orders.filter(function (o) {
    return now - new Date(o.created_at) < 7 * DAY;
  });
  const lastWeek = orders.filter(function (o) {
    const age = now - new Date(o.created_at);
    return age >= 7 * DAY && age < 14 * DAY;
  });

  const sum = function (list) {
    return list.reduce(function (total, o) {
      return total + o.total;
    }, 0);
  };
  const revenueNow = sum(thisWeek);
  const revenueBefore = sum(lastWeek);

  // Every single item sold in the last 30 days (one order can have several)
  const items = [];
  orders.forEach(function (o) {
    if (now - new Date(o.created_at) < 30 * DAY) {
      o.items.forEach(function (item) {
        items.push(item);
      });
    }
  });
  const byProduct = countBy(items, function (i) {
    return i.name;
  });
  const bySize = countBy(items, function (i) {
    return i.size;
  });

  // Sort products from most to least sold
  const productRanking = Object.entries(byProduct).sort(function (a, b) {
    return b[1] - a[1];
  });

  // ----- the 4 numbers -----
  document.querySelector("#kpi-revenue").textContent = revenueNow.toLocaleString();
  document.querySelector("#kpi-revenue-change").textContent = changeText(revenueNow, revenueBefore);
  document.querySelector("#kpi-orders").textContent = thisWeek.length;
  document.querySelector("#kpi-orders-change").textContent = changeText(thisWeek.length, lastWeek.length);
  document.querySelector("#kpi-average").textContent = thisWeek.length
    ? Math.round(revenueNow / thisWeek.length).toLocaleString()
    : "0";
  document.querySelector("#kpi-best").textContent = productRanking.length
    ? productRanking[0][0]
    : "—";

  // ----- revenue per day, last 14 days (days with no sales show 0) -----
  const dayLabels = [];
  const dayValues = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now - i * DAY);
    const key = dayKey(date);
    const revenue = orders
      .filter(function (o) {
        return dayKey(new Date(o.created_at)) === key;
      })
      .reduce(function (total, o) {
        return total + o.total;
      }, 0);
    dayLabels.push(date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }));
    dayValues.push(revenue);
  }

  // ----- sizes in a sensible order (S, M, L... then 30, 32...) -----
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];
  const sizeLabels = Object.keys(bySize).sort(function (a, b) {
    const ia = sizeOrder.indexOf(a);
    const ib = sizeOrder.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return Number(a) - Number(b);
  });

  drawBarChart("chart-days", dayLabels, dayValues, "EGP", false);
  drawBarChart(
    "chart-products",
    productRanking.map(function (p) { return p[0]; }),
    productRanking.map(function (p) { return p[1]; }),
    "items",
    true
  );
  drawBarChart(
    "chart-sizes",
    sizeLabels,
    sizeLabels.map(function (s) { return bySize[s]; }),
    "items",
    false
  );
}

// ===== 17. One function draws all three bar charts =====
function drawBarChart(canvasId, labels, values, unit, horizontal) {
  if (charts[canvasId]) charts[canvasId].destroy(); // remove the old chart first

  const ink = "#111111";
  const muted = "#6b6b6b";
  const grid = "rgba(0, 0, 0, 0.08)";

  charts[canvasId] = new Chart(document.getElementById(canvasId), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: ink,
          hoverBackgroundColor: "#c8a46b",
          borderRadius: 4,
          borderSkipped: "start", // round only the end of each bar
          maxBarThickness: horizontal ? 22 : 28
        }
      ]
    },
    options: {
      indexAxis: horizontal ? "y" : "x",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }, // one series: the title already names it
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = horizontal ? context.parsed.x : context.parsed.y;
              return " " + value.toLocaleString() + " " + unit;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: horizontal, color: grid },
          ticks: { color: muted, precision: 0 },
          border: { display: false },
          beginAtZero: true
        },
        y: {
          grid: { display: !horizontal, color: grid },
          ticks: { color: horizontal ? ink : muted, precision: 0 },
          border: { display: false },
          beginAtZero: true
        }
      }
    }
  });
}

document.querySelector("#sales-refresh-btn").addEventListener("click", loadSales);

// ===== 18. Start =====
showCorrectView();
