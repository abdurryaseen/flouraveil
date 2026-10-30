/* Flouraveil settings
   Checkout runs on Cloudflare Pages (functions/api/create-checkout-session.js).
   On the old GitHub Pages address there's no server, so the button shows
   "coming soon" there instead. */
window.FLOURAVEIL_CONFIG = {
  checkoutEndpoint: location.hostname.endsWith("github.io") ? "" : "/api/create-checkout-session",
};
