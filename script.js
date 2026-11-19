// ===== 0. Settings =====
const SHOP_PHONE = "201000000000"; // ← put the shop's WhatsApp number here

// NEW: connect to the database (values come from config.js)
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// NEW: products now come from the database, so the list starts empty
let products = [];

// ===== 1. The cart: load it from storage (or start empty) =====
let cart = [];
const saved = localStorage.getItem("nova-cart");
if (saved) {
  cart = JSON.parse(saved);
}

// ===== 2. Find the elements on the page =====
const productsEl = document.querySelector("#products");
const filtersEl = document.querySelector("#filters");
const countEl = document.querySelector("#cart-count");
const totalEl = document.querySelector("#cart-total");
const itemsEl = document.querySelector("#cart-items");
const panel = document.querySelector("#cart-panel");
const openBtn = document.querySelector("#cart-open");
const closeBtn = document.querySelector("#cart-close");
const form = document.querySelector("#checkout-form");

// NEW: the product details window
const modal = document.querySelector("#product-modal");
const modalImage = document.querySelector("#modal-image");
const modalName = document.querySelector("#modal-name");
const modalPrice = document.querySelector("#modal-price");
const modalDesc = document.querySelector("#modal-desc");
const modalSizes = document.querySelector("#modal-sizes");
const modalAdd = document.querySelector("#modal-add");
const modalClose = document.querySelector("#modal-close");
const sizeError = document.querySelector("#size-error");

let currentProduct = null; // the product open in the window
let selectedSize = null; // the size the customer picked

// ===== 3. Build the product cards from the products list =====
function renderProducts(category) {
  let list = products;
  if (category !== "all") {
    list = products.filter(function (product) {
      return product.category === category;
    });
  }

  productsEl.innerHTML = list
    .map(function (product) {
      return `
        <div class="card" data-id="${product.id}">
          <img src="${product.image}" alt="${product.name}" />
          <h3>${product.name}</h3>
          <p class="desc">${product.description}</p>
          <p class="price">${product.price.toLocaleString()} EGP</p>
          <button class="add-btn">Choose size</button>
        </div>
      `;
    })
    .join("");
}

// ===== NEW: load the products from the database =====
async function loadProducts() {
  productsEl.innerHTML = '<p class="loading">Loading products…</p>';

  const { data, error } = await db
    .from("products")
    .select("*")
    .order("id");

  if (error) {
    console.error(error);
    productsEl.innerHTML =
      '<p class="loading">Sorry, the products could not be loaded. Please refresh.</p>';
    return;
  }

  products = data;
  renderFilters();
  renderProducts("all");
}

// ===== 4. Category filter buttons (built from the products) =====
function renderFilters() {
  // Collect each category once, e.g. ["hoodies", "pants", "tees"]
  const categories = [];
  products.forEach(function (product) {
    if (!categories.includes(product.category)) {
      categories.push(product.category);
    }
  });

  // "hoodies" → "Hoodies"
  function niceName(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  filtersEl.innerHTML =
    '<button class="filter-btn active" data-category="all">All</button>' +
    categories
      .map(function (c) {
        return `<button class="filter-btn" data-category="${c}">${niceName(c)}</button>`;
      })
      .join("");
}

filtersEl.addEventListener("click", function (event) {
  if (!event.target.classList.contains("filter-btn")) return;

  filtersEl.querySelectorAll(".filter-btn").forEach(function (b) {
    b.classList.remove("active");
  });
  event.target.classList.add("active");
  renderProducts(event.target.dataset.category);
});

// ===== 5. NEW: open the product details window =====
function openProduct(id) {
  currentProduct = products.find(function (p) {
    return p.id === id;
  });
  selectedSize = null;

  modalImage.src = currentProduct.image;
  modalImage.alt = currentProduct.name;
  modalName.textContent = currentProduct.name;
  modalPrice.textContent = currentProduct.price.toLocaleString() + " EGP";
  modalDesc.textContent = currentProduct.description;

  // One button for each size of this product
  modalSizes.innerHTML = currentProduct.sizes
    .map(function (size) {
      return `<button class="size-btn" data-size="${size}">${size}</button>`;
    })
    .join("");

  sizeError.classList.remove("show");
  modalAdd.textContent = "Add to cart";
  modal.classList.add("open");
}

function closeProduct() {
  modal.classList.remove("open");
}

// Clicking anywhere on a card opens its details
productsEl.addEventListener("click", function (event) {
  const card = event.target.closest(".card");
  if (!card) return;
  openProduct(Number(card.dataset.id));
});

// Picking a size
modalSizes.addEventListener("click", function (event) {
  if (!event.target.classList.contains("size-btn")) return;

  modalSizes.querySelectorAll(".size-btn").forEach(function (b) {
    b.classList.remove("active");
  });
  event.target.classList.add("active");
  selectedSize = event.target.dataset.size;
  sizeError.classList.remove("show");
});

// "Add to cart" inside the window
modalAdd.addEventListener("click", function () {
  if (!selectedSize) {
    sizeError.classList.add("show"); // no size yet → show the warning
    return;
  }

  cart.push({
    id: currentProduct.id,
    name: currentProduct.name,
    price: currentProduct.price,
    size: selectedSize
  });
  renderCart();

  modalAdd.textContent = "Added ✓";
  setTimeout(closeProduct, 700);
});

// Three ways to close the window: ✕, clicking outside it, or the Esc key
modalClose.addEventListener("click", closeProduct);
modal.addEventListener("click", function (event) {
  if (event.target === modal) closeProduct();
});
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeProduct();
});

// ===== 6. Add up the prices =====
function getTotal() {
  let total = 0;
  cart.forEach(function (item) {
    total = total + item.price;
  });
  return total;
}

// ===== 7. Redraw the cart and save it =====
function itemLabel(item) {
  // "Black Hoodie (M)" — or just the name for old items without a size
  return item.size ? item.name + " (" + item.size + ")" : item.name;
}

function renderCart() {
  countEl.textContent = cart.length;
  itemsEl.innerHTML = "";

  if (cart.length === 0) {
    itemsEl.innerHTML = '<li class="empty">Your cart is empty</li>';
  }

  cart.forEach(function (item, index) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${itemLabel(item)}</span>
      <span>${item.price.toLocaleString()} EGP</span>
      <button class="remove-btn" data-index="${index}">✕</button>
    `;
    itemsEl.appendChild(li);
  });

  totalEl.textContent = getTotal().toLocaleString();
  localStorage.setItem("nova-cart", JSON.stringify(cart));
}

// ===== 8. Open and close the cart panel =====
openBtn.addEventListener("click", function (event) {
  event.preventDefault();
  panel.classList.add("open");
});

closeBtn.addEventListener("click", function () {
  panel.classList.remove("open");
});

// ===== 9. Remove an item =====
itemsEl.addEventListener("click", function (event) {
  if (event.target.classList.contains("remove-btn")) {
    const index = Number(event.target.dataset.index);
    cart.splice(index, 1);
    renderCart();
  }
});

// ===== 10. Checkout: send the order to WhatsApp =====
form.addEventListener("submit", function (event) {
  event.preventDefault();

  if (cart.length === 0) {
    alert("Your cart is empty. Add a product first!");
    return;
  }

  const name = document.querySelector("#customer-name").value;
  const phone = document.querySelector("#customer-phone").value;
  const address = document.querySelector("#customer-address").value;

  let message = "New order from NOVA Wear 🛍️\n\n";
  message += "Name: " + name + "\n";
  message += "Phone: " + phone + "\n";
  message += "Address: " + address + "\n\n";
  message += "Items:\n";
  cart.forEach(function (item) {
    message += "- " + itemLabel(item) + " — " + item.price.toLocaleString() + " EGP\n";
  });
  message += "\nTotal: " + getTotal().toLocaleString() + " EGP";

  // NEW: save the order in the database
  db.from("orders")
    .insert({
      customer_name: name,
      customer_phone: phone,
      customer_address: address,
      items: cart,
      total: getTotal()
    })
    .then(function (result) {
      if (result.error) {
        console.error("Order was not saved:", result.error);
      } else {
        console.log("Order saved in the database ✓");
      }
    });

  // Open WhatsApp right away (the order is saved in the background)
  const url = "https://wa.me/" + SHOP_PHONE + "?text=" + encodeURIComponent(message);
  window.open(url, "_blank");

  cart = [];
  renderCart();
  form.reset();
  panel.classList.remove("open");
});

// ===== 11. Start: draw everything when the page loads =====
loadProducts(); // NEW: fetch products from the database, then draw them
renderCart();
