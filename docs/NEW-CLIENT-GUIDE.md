# New client guide — a new store in about 1–2 hours

Example: a client called **"Zest"** wants a store.

## 1. Copy the template (10 min)

1. On GitHub, open `nova-store` → **Use this template** (turn it on first in **Settings → General → Template repository**), or download the code as a ZIP.
2. Create a new repository, e.g. `zest-store`, and open it in VS Code (**File → Open Folder**).

## 2. Create the client's database (15 min)

1. On **supabase.com** → **New project** → name `zest-store`, region **Central EU (Frankfurt)**, generate and save the database password.
2. **SQL Editor** → paste all of `database/setup-new-client.sql` → **Run**. You should see *Success*.
3. **Authentication → Sign In / Providers** → turn **off** "Allow new users to sign up" → **Save changes**.
4. **Authentication → Users → Add user** → the owner's email + password, **Auto Confirm** on.
5. SQL Editor → run: `insert into admins (user_id) select id from auth.users;`
6. **Project Settings → API Keys** → copy the **Project URL** and the **publishable key**.

## 3. Change the settings — `config.js` (5 min)

Change everything in this one file:

```js
const SUPABASE_URL = "…the client's Project URL…";
const SUPABASE_KEY = "…the client's publishable key…";

const STORE = {
  name: "Zest",
  logo: "ZEST",
  heroTitle: "…",
  heroText: "…",
  whatsapp: "2010XXXXXXXX", // country code + number, no + or spaces
  currency: "EGP",
  accentColor: "#…" // the client's brand color
};
```

## 4. Change the text Google and WhatsApp show — top of `index.html` (10 min)

Inside `<head>`, change: `<title>`, `description`, `canonical`, all `og:` lines (title, description, **image**, url), and the `ld+json` block (name, description, url, city). Also change the URLs in `sitemap.xml`, and the letter/colors in `favicon.svg`.

> The `og:image` should be a 1200×630 photo of the brand. When the client shares the link on WhatsApp, this is the picture people see.

## 5. Add the products (30 min, or the client does it)

Open `admin.html` → log in with the owner account → **Products → + Add product** → name, price, category, sizes, description, photo.

## 6. Publish (5 min)

VS Code → **Ctrl + Shift + G** → commit → **Publish Branch** (public) → GitHub repo **Settings → Pages** → branch `main`, `/ (root)` → **Save**.

## 7. Test, then hand over

Follow `docs/HANDOVER-CHECKLIST.md`.
