console.log("NOVA store is running!");
// 1. Remember how many items are in the cart
let cartCount = 0;

// 2. Find the elements on the page
const countEl = document.querySelector("#cart-count");
const buttons = document.querySelectorAll(".add-btn");

// 3. For every button, listen for a click
buttons.forEach(function (button) {
  button.addEventListener("click", function () {
    cartCount = cartCount + 1; // add one item
    countEl.textContent = cartCount; // show the new number

    button.textContent = "Added ✓"; // feedback for the customer
    setTimeout(function () {
      button.textContent = "Add to cart";
    }, 1000); // change it back after 1 second
  });
});
