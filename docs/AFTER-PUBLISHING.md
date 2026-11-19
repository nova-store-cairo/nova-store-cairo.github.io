# After publishing — Google, link previews, speed

## 1. Test the WhatsApp / Facebook link preview

- Send the store link to yourself on WhatsApp — you should see the photo, title and description.
- WhatsApp remembers previews. If you change the image, test with `…/?v=2` at the end of the link.
- Facebook's checker shows exactly what it sees: https://developers.facebook.com/tools/debug/

## 2. Get the store on Google

1. Open **Google Search Console**: https://search.google.com/search-console
2. Add the store's address as a property and verify it (the easiest way on GitHub Pages is the **HTML tag** method: paste Google's `<meta name="google-site-verification" …>` line into the `<head>` of `index.html`, commit, then click Verify).
3. **Sitemaps** → submit `sitemap.xml`.
4. It can take days or weeks for a new site to appear in search results.

> Note: the products are loaded by JavaScript after the page opens. Google can read this, but the **text in `index.html`** (title, description, hero) matters most — write it with the words customers search for, like "streetwear Cairo" or "hoodies Egypt".

## 3. Check speed

Run the store's address through **PageSpeed Insights**: https://pagespeed.web.dev/

Already done in this template: lazy-loading product photos, fixed photo shapes (no page jumping), early connections to the servers, scripts that load without blocking the page.

Biggest things you can still improve for a client:
- **Photo size**: upload photos around 1000–1500 px wide, not 4000 px phone originals.
- Fewer, better products on the first screen.
