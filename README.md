# Flouraveil

A soft, blossom-inspired storefront for modest Islamic womenswear — niqabs, gloves and socks.

Plain HTML/CSS/JS, no build step. Open `index.html` or serve the folder (e.g. GitHub Pages).

## Structure
- `index.html` — page layout
- `css/style.css` — blush / ivory / rosewood theme
- `js/main.js` — filters, wishlist, bag drawer
- `images/` — mood imagery (logo goes here as `logo.png`)

## Customising
- **Logo:** `images/logo.png` (dark), `logo-rose.png`, `logo-light.png`.
- **Products:** edit `data/products.json` (used by both the shop and checkout); add `image: "images/products/xyz.jpg"` to use a real photo instead of the illustrated placeholder.

## Hosting & Stripe checkout (Cloudflare Pages)

The site and its checkout both run on Cloudflare Pages. `functions/api/create-checkout-session.js`
creates a Stripe Checkout Session; prices come from `data/products.json` on the server, so they
can't be changed in the browser. No build step and no npm packages.

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → `flouraveil`.
   Framework preset: None. Build command: empty. Output directory: `/`.
2. Settings → Variables and Secrets → add `STRIPE_SECRET_KEY` as a **Secret**
   (`sk_test_...` while testing). Never put the key in this repo. Redeploy.
3. Test with card `4242 4242 4242 4242`, any future date, any CVC. Swap in `sk_live_...` at launch.

Optional variables: `SITE_URL` (defaults to the site's own address), `CURRENCY` (defaults to `usd`).
Shipping is free over $120 and $8 otherwise (top of the function file). After payment customers
land on `success.html`; orders appear in the Stripe dashboard. The old GitHub Pages copy still
works but shows "coming soon" at checkout.
