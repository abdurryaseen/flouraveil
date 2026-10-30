/* ============================================================
   Flouraveil — storefront script
   Product images are illustrated SVG placeholders. Swap any
   product's `image` field (in data/products.json) for a real photo path (e.g.
   "images/products/rose-abaya.jpg") and it will be used instead.
   ============================================================ */

// Product catalogue lives in data/products.json (shared with the Stripe checkout function).
let PRODUCTS = [];

/* ---------- Illustrated garment placeholders ---------- */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  return "#" + [c(n >> 16), c((n >> 8) & 255), c(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function garmentSVG(type, color) {
  const trim = shade(color, -45);
  const light = shade(color, 30);
  if (type === "abaya") {
    return `<svg viewBox="0 0 200 400" aria-hidden="true">
      <path d="M85 30 Q100 42 115 30 L140 44 Q162 100 184 168 L156 180 Q140 132 132 96 Q150 240 168 390 L32 390 Q50 240 68 96 Q60 132 44 180 L16 168 Q38 100 60 44 Z" fill="${color}"/>
      <path d="M100 38 L100 390" stroke="${trim}" stroke-width="1.5" opacity=".6"/>
      <path d="M16 168 L44 180 M184 168 L156 180" stroke="${trim}" stroke-width="5" stroke-linecap="round"/>
      <path d="M68 96 Q100 108 132 96" stroke="${light}" stroke-width="2" fill="none" opacity=".8"/>
      <path d="M40 300 Q100 312 160 300" stroke="${light}" stroke-width="1.5" fill="none" opacity=".6"/>
      <g fill="${trim}" opacity=".55"><circle cx="100" cy="150" r="2.5"/><circle cx="100" cy="190" r="2.5"/><circle cx="100" cy="230" r="2.5"/></g>
    </svg>`;
  }
  const drape = `<path d="M100 18 C132 18 146 46 146 76 C152 132 184 220 190 300 Q100 322 10 300 C16 220 48 132 54 76 C54 46 68 18 100 18 Z" fill="${color}"/>
      <path d="M60 140 Q100 160 140 140 M40 230 Q100 252 160 230" stroke="${trim}" stroke-width="1.5" fill="none" opacity=".35"/>`;
  if (type === "niqab") {
    return `<svg viewBox="0 0 200 330" aria-hidden="true">${drape}
      <ellipse cx="100" cy="82" rx="26" ry="34" fill="${shade(color, -20)}"/>
      <rect x="78" y="70" width="44" height="7" rx="3.5" fill="#4a3438"/>
      <path d="M74 64 Q100 58 126 64" stroke="${trim}" stroke-width="2" fill="none"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 200 330" aria-hidden="true">${drape}
      <ellipse cx="100" cy="82" rx="24" ry="32" fill="#fffaf6" opacity=".9"/>
      <path d="M76 82 Q100 122 124 82" stroke="${trim}" stroke-width="2" fill="none"/>
    </svg>`;
}

function media(p, color = p.colors[0]) {
  return p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy" />` : garmentSVG(p.type, color);
}

/* ---------- Render products ---------- */
const grid = document.getElementById("products");
const wishlist = new Set();

function renderProducts(filter = "all") {
  const list = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.type === filter);
  if (!list.length) {
    const label = filter.charAt(0).toUpperCase() + filter.slice(1);
    grid.innerHTML = `<p class="products__empty">${label} are coming soon, in shaa Allah ❀</p>`;
    return;
  }
  grid.innerHTML = list.map((p, i) => `
    <article class="product" style="animation-delay:${i * 60}ms">
      <div class="product__media" style="background:${p.bg}">
        ${p.tag ? `<span class="product__tag">${p.tag}</span>` : ""}
        <button class="product__wish ${wishlist.has(p.id) ? "is-on" : ""}" data-wish="${p.id}" aria-label="Add ${p.name} to wishlist">♡</button>
        <div class="product__art" data-art="${p.id}">${media(p)}</div>
        <button class="product__add" data-add="${p.id}">Add to bag</button>
      </div>
      <div class="product__info">
        <div><h3>${p.name}</h3><p>${p.fabric}</p></div>
        <span class="product__price">$${p.price}</span>
      </div>
      <div class="swatches">${p.colors.map((c) => `<i style="background:${c}" data-swatch="${p.id}" data-color="${c}" title="Colour option"></i>`).join("")}</div>
    </article>`).join("");
}

/* ---------- Filters ---------- */
function setFilter(f) {
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c.dataset.filter === f));
  renderProducts(f);
}
document.querySelectorAll(".chip").forEach((chip) => chip.addEventListener("click", () => setFilter(chip.dataset.filter)));
document.querySelectorAll(".collection-card").forEach((card) => card.addEventListener("click", () => setFilter(card.dataset.filter)));

/* ---------- Cart ---------- */
const cart = new Map();
const drawer = document.querySelector(".drawer");
const overlay = document.querySelector(".overlay");
const toast = document.querySelector(".toast");

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("is-show");
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove("is-show"), 2200);
}

function saveCart() {
  try { localStorage.setItem("flouraveil-bag", JSON.stringify([...cart.values()].map(({ p, qty }) => ({ id: p.id, qty })))); } catch (e) {}
}
function restoreCart() {
  try {
    (JSON.parse(localStorage.getItem("flouraveil-bag")) || []).forEach(({ id, qty }) => {
      const p = PRODUCTS.find((x) => x.id === id);
      if (p && qty > 0) cart.set(p.id, { p, qty });
    });
  } catch (e) {}
}

function renderCart() {
  saveCart();
  const items = [...cart.values()];
  document.querySelector(".cart-count").textContent = items.reduce((n, i) => n + i.qty, 0);
  document.getElementById("subtotal").textContent = "$" + items.reduce((s, i) => s + i.qty * i.p.price, 0);
  document.querySelector(".drawer__items").innerHTML = items.length
    ? items.map(({ p, qty }) => `
      <li>
        <div class="drawer__thumb" style="background:${p.bg}">${media(p)}</div>
        <div><h4>${p.name}</h4><small>$${p.price}</small>
          <div class="qty"><button data-dec="${p.id}">−</button>${qty}<button data-inc="${p.id}">+</button></div>
        </div>
        <strong>$${p.price * qty}</strong>
      </li>`).join("")
    : `<li class="drawer__empty" style="display:block">Your bag is waiting to bloom ❀</li>`;
}

function toggleDrawer(open) {
  drawer.classList.toggle("is-open", open);
  overlay.classList.toggle("is-open", open);
  drawer.setAttribute("aria-hidden", !open);
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-add],[data-wish],[data-inc],[data-dec],[data-swatch]");
  if (!t) return;
  if (t.dataset.add) {
    const p = PRODUCTS.find((x) => x.id == t.dataset.add);
    const item = cart.get(p.id) || { p, qty: 0 };
    item.qty++;
    cart.set(p.id, item);
    renderCart();
    showToast(`${p.name} added to your bag`);
  } else if (t.dataset.wish) {
    const id = +t.dataset.wish;
    wishlist.has(id) ? wishlist.delete(id) : wishlist.add(id);
    t.classList.toggle("is-on");
    t.textContent = wishlist.has(id) ? "♥" : "♡";
  } else if (t.dataset.inc || t.dataset.dec) {
    const id = +(t.dataset.inc || t.dataset.dec);
    const item = cart.get(id);
    item.qty += t.dataset.inc ? 1 : -1;
    if (item.qty <= 0) cart.delete(id);
    renderCart();
  } else if (t.dataset.swatch) {
    const p = PRODUCTS.find((x) => x.id == t.dataset.swatch);
    if (!p.image) document.querySelector(`[data-art="${p.id}"]`).innerHTML = garmentSVG(p.type, t.dataset.color);
  }
});

document.querySelector(".cart-btn").addEventListener("click", () => toggleDrawer(true));
document.querySelector(".drawer__close").addEventListener("click", () => toggleDrawer(false));
overlay.addEventListener("click", () => toggleDrawer(false));
const checkoutBtn = document.querySelector(".drawer__foot .btn");
checkoutBtn.addEventListener("click", async () => {
  if (!cart.size) return showToast("Your bag is empty");
  const endpoint = (window.FLOURAVEIL_CONFIG || {}).checkoutEndpoint;
  if (!endpoint) return showToast("Checkout is coming soon, in shaa Allah");
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = "Opening secure checkout…";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [...cart.values()].map(({ p, qty }) => ({ id: p.id, qty })) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || "Checkout is unavailable right now. Please try again soon.");
    window.location.href = data.url;
  } catch (err) {
    showToast(err.message || "Could not start checkout");
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = "Checkout";
  }
});

/* ---------- Mobile menu ---------- */
const burger = document.querySelector(".nav__burger");
const links = document.querySelector(".nav__links");
burger.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", open);
});
links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => links.classList.remove("is-open")));

/* ---------- Newsletter ---------- */
document.querySelector(".newsletter__form").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.hidden = true;
  document.querySelector(".newsletter__msg").hidden = false;
});

/* ---------- Falling petals ---------- */
const petals = document.querySelector(".petals");
for (let i = 0; i < 18; i++) {
  const s = document.createElement("span");
  s.className = "petal";
  s.style.left = Math.random() * 100 + "%";
  s.style.animationDuration = 8 + Math.random() * 10 + "s";
  s.style.animationDelay = -Math.random() * 15 + "s";
  s.style.transform = `scale(${0.6 + Math.random() * 0.8})`;
  petals.appendChild(s);
}

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Load catalogue ---------- */
fetch("data/products.json")
  .then((r) => r.json())
  .then((data) => {
    PRODUCTS = data;
    renderProducts();
    restoreCart();
    renderCart();
  })
  .catch(() => { grid.innerHTML = "<p>Products could not be loaded. Please refresh.</p>"; });
