// Vercel serverless function: creates a Stripe Checkout Session for the bag.
// Prices are always read from data/products.json on the server, never from
// the browser, so customers can't change what they pay.
//
// Environment variables (set in Vercel → Project → Settings → Environment Variables):
//   STRIPE_SECRET_KEY  sk_test_... while testing, sk_live_... when you launch
//   SITE_URL           where the store lives, e.g. https://abdurryaseen.github.io/flouraveil
//   CURRENCY           optional, defaults to "usd"

const Stripe = require("stripe");
const PRODUCTS = require("../data/products.json");

const FREE_SHIPPING_OVER = 120; // dollars, matches the announcement bar
const STANDARD_SHIPPING = 8;    // dollars
const COUNTRIES = ["US", "CA", "GB", "AU", "AE", "SA", "QA", "KW", "BH", "OM", "MY", "SG", "DE", "FR", "NL", "IE"];

module.exports = async (req, res) => {
  const site = (process.env.SITE_URL || "").replace(/\/$/, "");
  const origin = site ? new URL(site).origin : "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.STRIPE_SECRET_KEY || !site) {
    return res.status(500).json({ error: "Checkout is not configured yet." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const currency = process.env.CURRENCY || "usd";

    const line_items = [];
    let subtotal = 0;
    for (const { id, qty, color } of items) {
      const p = PRODUCTS.find((x) => x.id === Number(id));
      const quantity = Math.min(20, Math.max(1, parseInt(qty, 10) || 0));
      if (!p) continue;
      subtotal += p.price * quantity;
      line_items.push({
        quantity,
        price_data: {
          currency,
          unit_amount: Math.round(p.price * 100),
          product_data: {
            name: p.name,
            description: [p.fabric, color && `Colour ${color}`].filter(Boolean).join(" · "),
            ...(p.image ? { images: [`${site}/${p.image}`] } : {}),
            metadata: { product_id: String(p.id) },
          },
        },
      });
    }
    if (!line_items.length) return res.status(400).json({ error: "Your bag is empty." });

    const shippingAmount = subtotal >= FREE_SHIPPING_OVER ? 0 : STANDARD_SHIPPING * 100;
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
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
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Could not start checkout. Please try again." });
  }
};
