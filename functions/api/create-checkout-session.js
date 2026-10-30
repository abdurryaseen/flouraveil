// Cloudflare Pages Function → POST /api/create-checkout-session
// Creates a Stripe Checkout Session for the bag. Prices are always read from
// data/products.json here on the server, never from the browser.
//
// Cloudflare → Pages project → Settings → Variables and Secrets:
//   STRIPE_SECRET_KEY  (secret)  sk_test_... while testing, sk_live_... at launch
//   SITE_URL           optional; defaults to the site's own address
//   CURRENCY           optional; defaults to "usd"

import PRODUCTS from "../../data/products.json";

const FREE_SHIPPING_OVER = 120; // dollars, matches the announcement bar
const STANDARD_SHIPPING = 8;    // dollars
const COUNTRIES = ["US", "CA", "GB", "AU", "AE", "SA", "QA", "KW", "BH", "OM", "MY", "SG", "DE", "FR", "NL", "IE"];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

// Stripe's API takes form-encoded bodies with bracketed keys: line_items[0][quantity]=1
function toForm(obj, prefix, out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") toForm(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: "Checkout is not configured yet." }, 500);

  const site = (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const currency = env.CURRENCY || "usd";

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const items = Array.isArray(body?.items) ? body.items.slice(0, 50) : [];

  const line_items = [];
  let subtotal = 0;
  for (const { id, qty } of items) {
    const p = PRODUCTS.find((x) => x.id === Number(id));
    if (!p) continue;
    const quantity = Math.min(20, Math.max(1, parseInt(qty, 10) || 1));
    subtotal += p.price * quantity;
    line_items.push({
      quantity,
      price_data: {
        currency,
        unit_amount: Math.round(p.price * 100),
        product_data: {
          name: p.name,
          description: p.fabric,
          images: p.image ? [`${site}/${p.image}`] : undefined,
          metadata: { product_id: String(p.id) },
        },
      },
    });
  }
  if (!line_items.length) return json({ error: "Your bag is empty." }, 400);

  const shippingAmount = subtotal >= FREE_SHIPPING_OVER ? 0 : STANDARD_SHIPPING * 100;
  const session = {
    mode: "payment",
    line_items,
    shipping_address_collection: { allowed_countries: COUNTRIES },
    shipping_options: [{
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: shippingAmount ? "Standard shipping" : "Free shipping",
        fixed_amount: { amount: shippingAmount, currency },
        delivery_estimate: { minimum: { unit: "business_day", value: 3 }, maximum: { unit: "business_day", value: 8 } },
      },
    }],
    phone_number_collection: { enabled: true },
    allow_promotion_codes: true,
    success_url: `${site}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/#shop`,
  };

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: toForm(session),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Stripe error", data?.error?.message);
    return json({ error: "Could not start checkout. Please try again." }, 502);
  }
  return json({ url: data.url });
}
