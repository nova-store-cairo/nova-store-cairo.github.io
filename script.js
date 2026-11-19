// ===== 0. Settings =====
const SHOP_PHONE = "201000000000"; // ← put the shop's WhatsApp number here

// ===== 1. The cart: load it from storage (or start empty) =====
let cart = [];
const saved = localStorage.getItem("nova-cart");
if (saved) {
  cart = JSON.parse(saved);
}

// ===== 2. Find the elements on the page =====
const countEl = document.querySelector("#cart-count");
const totalEl = document.querySelector("#cart-total");
const itemsEl = document.querySelector("#cart-items");
const panel = document.querySelector("#cart-panel");
const openBtn = document.querySelector("#cart-open");
const closeBtn = document.querySelector("#cart-close");
const buttons = document.querySelectorAll(".add-btn");
const form = document.querySelector("#checkout-form");

// ===== 3. Add up the prices =====
function getTotal() {
  let total = 0;
  cart.forEach(function (item) {
    total = total + item.price;
  });
  return total;
}

// ===== 4. Redraw the cart and save it =====
function renderCart() {
  countEl.textContent = cart.length;
  itemsEl.innerHTML = "";

  if (cart.length === 0) {
    itemsEl.innerHTML = '<li class="empty">Your cart is empty</li>';
  }

  cart.forEach(function (item, index) {
    const li = document.createElement("li");
    li.innerHTML =
      "<span>" +
      item.name +
      "</span>" +
      "<span>" +
      item.price.toLocaleString() +
      " EGP</span>" +
      '<button class="remove-btn" data-index="' +
      index +
      '">✕</button>';
    itemsEl.appendChild(li);
  });

  totalEl.textContent = getTotal().toLocaleString();

  // Save the cart in the browser so it survives a refresh
  localStorage.setItem("nova-cart", JSON.stringify(cart));
}

// ===== 5. "Add to cart" buttons =====
buttons.forEach(function (button) {
  button.addEventListener("click", function () {
    cart.push({
      name: button.dataset.name,
      price: Number(button.dataset.price),
    });
    renderCart();

    button.textContent = "Added ✓";
    setTimeout(function () {
      button.textContent = "Add to cart";
    }, 1000);
  });
});

// ===== 6. Open and close the panel =====
openBtn.addEventListener("click", function (event) {
  event.preventDefault();
  panel.classList.add("open");
});

closeBtn.addEventListener("click", function () {
  panel.classList.remove("open");
});

// ===== 7. Remove an item =====
itemsEl.addEventListener("click", function (event) {
  if (event.target.classList.contains("remove-btn")) {
    const index = Number(event.target.dataset.index);
    cart.splice(index, 1);
    renderCart();
  }
});

// ===== 8. Checkout: send the order to WhatsApp =====
form.addEventListener("submit", function (event) {
  event.preventDefault(); // stop the page from reloading

  if (cart.length === 0) {
    alert("Your cart is empty. Add a product first!");
    return;
  }

  const name = document.querySelector("#customer-name").value;
  const phone = document.querySelector("#customer-phone").value;
  const address = document.querySelector("#customer-address").value;

  // Build the order message, line by line
  let message = "New order from NOVA Wear 🛍️\n\n";
  message += "Name: " + name + "\n";
  message += "Phone: " + phone + "\n";
  message += "Address: " + address + "\n\n";
  message += "Items:\n";
  cart.forEach(function (item) {
    message +=
      "- " + item.name + " — " + item.price.toLocaleString() + " EGP\n";
  });
  message += "\nTotal: " + getTotal().toLocaleString() + " EGP";

  // Open WhatsApp with the message ready
  const url =
    "https://wa.me/" + SHOP_PHONE + "?text=" + encodeURIComponent(message);
  window.open(url, "_blank");

  // Empty the cart after ordering
  cart = [];
  renderCart();
  form.reset();
  panel.classList.remove("open");
});

// ===== 9. Show the saved cart when the page loads =====
renderCart();
