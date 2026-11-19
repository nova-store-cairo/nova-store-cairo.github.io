// ===== 0. Settings =====
const SHOP_PHONE = "201000000000"; // ← put the shop's WhatsApp number here

// ===== 1. The cart: load it from storage (or start empty) =====
let cart = [];
const saved = localStorage.getItem("nova-cart");
if (saved) {
  cart = JSON.parse(saved);
}

// ===== 2. Find the elements on the page =====
const productsEl = document.querySelector("#products");
const filterButtons = document.querySelectorAll(".filter-btn");
const countEl = document.querySelector("#cart-count");
const totalEl = document.querySelector("#cart-total");
const itemsEl = document.querySelector("#cart-items");
const panel = document.querySelector("#cart-panel");
const openBtn = document.querySelector("#cart-open");
const closeBtn = document.querySelector("#cart-close");
const form = document.querySelector("#checkout-form");

// ===== 3. NEW: build the product cards from the products list =====
function renderProducts(category) {
  // Keep only the products of the chosen category
  let list = products;
  if (category !== "all") {
    list = products.filter(function (product) {
      return product.category === category;
    });
  }

  // Turn each product into a card (HTML text), then join them together
  productsEl.innerHTML = list
    .map(function (product) {
      return `
        <div class="card">
          <img src="${product.image}" alt="${product.name}" />
          <h3>${product.name}</h3>
          <p class="desc">${product.description}</p>
          <p class="price">${product.price.toLocaleString()} EGP</p>
          <button class="add-btn" data-id="${product.id}">Add to cart</button>
        </div>
      `;
    })
    .join("");
}

// ===== 4. NEW: category filter buttons =====
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    filterButtons.forEach(function (b) {
      b.classList.remove("active");
    });
    button.classList.add("active");
    renderProducts(button.dataset.category);
  });
});

// ===== 5. Add up the prices =====
function getTotal() {
  let total = 0;
  cart.forEach(function (item) {
    total = total + item.price;
  });
  return total;
}

// ===== 6. Redraw the cart and save it =====
function renderCart() {
  countEl.textContent = cart.length;
  itemsEl.innerHTML = "";

  if (cart.length === 0) {
    itemsEl.innerHTML = '<li class="empty">Your cart is empty</li>';
  }

  cart.forEach(function (item, index) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${item.name}</span>
      <span>${item.price.toLocaleString()} EGP</span>
      <button class="remove-btn" data-index="${index}">✕</button>
    `;
    itemsEl.appendChild(li);
  });

  totalEl.textContent = getTotal().toLocaleString();
  localStorage.setItem("nova-cart", JSON.stringify(cart));
}

// ===== 7. "Add to cart" (one listener for ALL cards) =====
productsEl.addEventListener("click", function (event) {
  if (!event.target.classList.contains("add-btn")) return;

  const button = event.target;
  const id = Number(button.dataset.id);
  const product = products.find(function (p) {
    return p.id === id;
  });

  cart.push({ id: product.id, name: product.name, price: product.price });
  renderCart();

  button.textContent = "Added ✓";
  setTimeout(function () {
    button.textContent = "Add to cart";
  }, 1000);
});

// ===== 8. Open and close the panel =====
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
    message += "- " + item.name + " — " + item.price.toLocaleString() + " EGP\n";
  });
  message += "\nTotal: " + getTotal().toLocaleString() + " EGP";

  const url = "https://wa.me/" + SHOP_PHONE + "?text=" + encodeURIComponent(message);
  window.open(url, "_blank");

  cart = [];
  renderCart();
  form.reset();
  panel.classList.remove("open");
});

// ===== 11. Start: draw everything when the page loads =====
renderProducts("all");
renderCart();
