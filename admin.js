// =====================================================
// NOVA Admin — owner login + orders dashboard
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

const STATUSES = ["new", "confirmed", "delivered", "cancelled"];

// ===== 2. Safety: never trust what customers typed =====
// A customer could type HTML or code as their "name". This turns
// characters like < and > into harmless text before we show it.
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
  showCorrectView();
});

// ===== 6. Load the orders (newest first) =====
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

// ===== 7. The numbers at the top =====
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

// ===== 8. One card per order =====
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

// ===== 9. Change an order's status =====
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

// ===== 10. Refresh button =====
refreshBtn.addEventListener("click", loadOrders);

// ===== 11. Start =====
showCorrectView();
