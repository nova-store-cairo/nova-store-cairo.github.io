# Handover checklist — before giving a store to a client

## Settings
- [ ] `config.js`: the client's Supabase URL + publishable key, name, logo, hero texts, **WhatsApp number**, currency, color
- [ ] `index.html` `<head>`: title, description, all `og:` lines, `ld+json`, canonical
- [ ] `sitemap.xml` and `favicon.svg` updated
- [ ] No demo orders left: `delete from orders where customer_name like 'Demo customer %';`

## Security
- [ ] Only the **publishable** key is in the code (search the project for `secret` and `service_role` — no results)
- [ ] Supabase: "Allow new users to sign up" is **off**
- [ ] The owner can log in; a logged-out visitor sees **no** orders
- [ ] The owner's password is strong, and **the client** chose it (you don't keep it)

## Store test (on a phone AND a laptop)
- [ ] Products and photos load; every category filter works
- [ ] Product window opens; a size must be chosen; Add to cart works
- [ ] Cart remembers items after a refresh; remove works; total is right
- [ ] Checkout: order appears in **Admin → Orders**, and WhatsApp opens **on the client's number** with the right items and sizes
- [ ] The "Contact" link opens the client's WhatsApp
- [ ] Sharing the link on WhatsApp shows the right photo and title

## Admin test
- [ ] Change an order's status — the card color and numbers update
- [ ] Add, edit (with a new photo) and delete a test product
- [ ] Sales tab shows numbers and charts

## Hand over
- [ ] Custom domain connected and **Enforce HTTPS** ticked (if they bought one)
- [ ] The client owns: the domain, and ideally the Supabase project (invite them, or create it under their account)
- [ ] Show the owner (10 minutes): log in → orders → change status → add a product with a photo → sales tab
- [ ] Agree in writing what's included in your monthly fee (hosting care, small changes, support hours)
