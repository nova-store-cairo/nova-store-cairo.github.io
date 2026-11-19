# Custom domain — `novawear.com` instead of `….github.io/nova-store`

A domain costs money each year, so **the client buys it in their own name** (they must own their brand's address). You then connect it.

## 1. Buy the domain (client)

Any registrar works (e.g. Namecheap, GoDaddy, Cloudflare). For a `.eg` / `.com.eg` address, use an Egyptian registrar.

## 2. Tell GitHub about it

GitHub repo → **Settings → Pages → Custom domain** → type `novawear.com` → **Save**.
(GitHub then adds a file called `CNAME` to the repo — keep it.)

## 3. Point the domain at GitHub (in the registrar's DNS settings)

Add **four A records** for the main domain (host `@`):

| Type | Host | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

And one record so `www.novawear.com` works too:

| Type | Host | Value |
|---|---|---|
| CNAME | www | `samirtarek82005-tech.github.io` |

Check GitHub's page for the current addresses before you start:
https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## 4. Wait, then turn on HTTPS

DNS changes take from a few minutes up to 24–48 hours. When GitHub shows the domain as working, tick **Enforce HTTPS**.

## 5. Update the addresses in the code

Replace `https://samirtarek82005-tech.github.io/nova-store/` with `https://novawear.com/` in:

- `index.html` → `canonical`, `og:url`, and the `ld+json` `url`
- `sitemap.xml`

Commit and sync.
