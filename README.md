# NOVA Store — website template with admin & sales dashboard

A complete small-business online store:

- **Store** (`index.html`): products from a database, category filters, product details with sizes, cart (saved in the browser), checkout that **saves the order** and **opens WhatsApp** with the full order.
- **Admin** (`admin.html`): owner login, **Orders** (change status), **Products** (add / edit / delete, upload photos), **Sales** (revenue, orders, average order, best sellers, popular sizes).
- **Database**: Supabase (products, orders, admins, photo storage) with security rules.
- **Hosting**: GitHub Pages (free).

## Files

| File | What it is |
|---|---|
| `config.js` | **Store settings** — Supabase connection, name, texts, WhatsApp number, currency, accent color |
| `index.html` / `script.js` / `style.css` | The store |
| `admin.html` / `admin.js` / `admin.css` | The owner's admin page |
| `404.html` | "Page not found" page |
| `favicon.svg` | Browser-tab icon |
| `sitemap.xml` | Page list for Google |
| `database/setup-new-client.sql` | **Full database setup for a new client** (one file) |
| `database/demo-orders.sql` | Fake orders for testing the charts (+ the line to delete them) |
| `database/*.sql` (others) | The original setup steps, kept for reference |
| `products.js` | Old product list (not used anymore — products live in the database) |
| `docs/` | Guides: new client, custom domain, after publishing, handover |

## Guides

1. [`docs/NEW-CLIENT-GUIDE.md`](docs/NEW-CLIENT-GUIDE.md) — make a store for a new client
2. [`docs/CUSTOM-DOMAIN.md`](docs/CUSTOM-DOMAIN.md) — use a real domain like `novawear.com`
3. [`docs/AFTER-PUBLISHING.md`](docs/AFTER-PUBLISHING.md) — Google, link previews, speed checks
4. [`docs/HANDOVER-CHECKLIST.md`](docs/HANDOVER-CHECKLIST.md) — before giving the store to a client

## Security rules (never break these)

- Only the **publishable** Supabase key goes in `config.js`. The **secret / service_role** key never goes in any website file.
- Public sign-ups stay **off**. Owners are added in Supabase → Authentication → Users.
- Customer text is always passed through `escapeHtml()` before it is shown in the admin page.
