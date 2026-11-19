// ===== 1. The cart: a list of products =====
const cart = [];

// ===== 2. Find the elements on the page =====
const countEl = document.querySelector("#cart-count");
const totalEl = document.querySelector("#cart-total");
const itemsEl = document.querySelector("#cart-items");
const panel = document.querySelector("#cart-panel");
const openBtn = document.querySelector("#cart-open");
const closeBtn = document.querySelector("#cart-close");
const buttons = document.querySelectorAll(".add-btn");

// ===== 3. A function that redraws the cart =====
function renderCart() {
  countEl.textContent = cart.length; // how many items
  itemsEl.innerHTML = ""; // empty the list first

  let total = 0;
  cart.forEach(function (item, index) {
    total = total + item.price;

    const li = document.createElement("li");
    li.innerHTML =
      "<span>" +
      item.name +
      "</span>" +
      "<span>" +
      item.price +
      " EGP</span>" +
      '<button class="remove-btn" data-index="' +
      index +
      '">✕</button>';
    itemsEl.appendChild(li);
  });

  totalEl.textContent = total.toLocaleString(); // 1650 → "1,650"
}

// ===== 4. "Add to cart" buttons =====
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

// ===== 5. Open and close the panel =====
openBtn.addEventListener("click", function (event) {
  event.preventDefault(); // stop the link from jumping to the top
  panel.classList.add("open");
});

closeBtn.addEventListener("click", function () {
  panel.classList.remove("open");
});

// ===== 6. Remove an item =====
itemsEl.addEventListener("click", function (event) {
  if (event.target.classList.contains("remove-btn")) {
    const index = Number(event.target.dataset.index);
    cart.splice(index, 1); // remove 1 item at that position
    renderCart();
  }
});
