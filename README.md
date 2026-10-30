# Flouraveil

A soft, blossom-inspired storefront for modest Islamic womenswear — abayas, niqabs and khimars.

Plain HTML/CSS/JS, no build step. Open `index.html` or serve the folder (e.g. GitHub Pages).

## Structure
- `index.html` — page layout
- `css/style.css` — blush / ivory / rosewood theme
- `js/main.js` — product catalogue, filters, wishlist, bag drawer
- `images/` — mood imagery (logo goes here as `logo.png`)

## Customising
- **Logo:** drop `images/logo.png` in and replace the marked `LOGO` block in `index.html`.
- **Products:** edit the `PRODUCTS` array in `js/main.js`; add `image: "images/products/xyz.jpg"` to use a real photo instead of the illustrated placeholder.

## Stripe checkout

The bag checks out through Stripe Checkout. Because GitHub Pages can't run server code,
a small function in `api/create-checkout-session.js` runs on Vercel (free plan is fine).
Prices come from `data/products.json` on the server, so they can't be changed in the browser.

1. **Stripe:** sign up at stripe.com and copy your *secret* key from Developers → API keys
   (`sk_test_...` for testing). Never put the secret key in this repo.
2. **Vercel:** sign in at vercel.com with GitHub → Add New → Project → import `flouraveil` → Deploy.
3. In Vercel → Project → Settings → Environment Variables, add:
   - `STRIPE_SECRET_KEY` = your `sk_test_...` key
   - `SITE_URL` = `https://abdurryaseen.github.io/flouraveil`
   then redeploy.
4. Put `https://<your-project>.vercel.app/api/create-checkout-session` into `js/config.js`
   as `checkoutEndpoint`.
5. Test with card `4242 4242 4242 4242`, any future date, any CVC. When it works, swap in
   your `sk_live_...` key in Vercel.

Shipping is free over $120 and $8 otherwise (edit at the top of the function file).
After payment, customers land on `success.html`; orders show up in your Stripe dashboard.
