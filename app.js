(() => {
'use strict';

/* ---------- Data ---------- */
const COLORS = {
  White:'#f5f5f2', Black:'#1a1a1a', Beige:'#d8cdb6', Orange:'#e8821e', Cream:'#eee3c9',
  Grey:'#a3a7ab', Rust:'#b4623f', Blue:'#8fb0d6', Plaid:'#27394a', Denim:'#5b7599',
  Stripe:'#2c2c2c', Yellow:'#f0b429', Red:'#c8281e', Floral:'#e9d7c6'
};
const SIZES = ['XS','S','M','L','XL'];

const PRODUCTS = [
  {id:1, name:'Everyday Tee', cat:'Tops', img:'tee-white', price:28, rating:4.8, reviews:2140, tag:'Bestseller', colors:['White'], desc:'Heavyweight organic cotton with a relaxed fit. Gets softer with every wash.'},
  {id:2, name:'Minimal Black Tee', cat:'Tops', img:'tee-black', price:34, rating:4.7, reviews:640, tag:'New', colors:['Black'], desc:'A boxy, drapey tee with a subtle chest print. Pairs with everything.'},
  {id:3, name:'Lucky Cat Graphic Tee', cat:'Tops', img:'tee-lucky-cat', price:38, rating:4.6, reviews:412, colors:['Beige'], desc:'Bold screen-print on soft sand jersey. Limited run.'},
  {id:4, name:'Crew Sweatshirt', cat:'Tops', img:'sweatshirt-orange', price:58, rating:4.7, reviews:733, colors:['Orange'], desc:'Midweight loopback cotton with ribbed cuffs. A shot of colour for grey days.'},
  {id:5, name:'Crochet Fringe Poncho', cat:'Tops', img:'poncho', price:89, was:110, rating:4.5, reviews:198, tag:'Sale', colors:['Cream'], desc:'Hand-finished open-knit cotton with a fringed hem. Layer it over anything.'},
  {id:6, name:'Cloud Hoodie', cat:'Outerwear', img:'hoodie-grey', price:72, rating:4.8, reviews:3011, tag:'Bestseller', colors:['Grey'], desc:'Brushed-back fleece in a boxy, cozy cut. Your new weekend uniform.'},
  {id:7, name:'Faux Leather Biker', cat:'Outerwear', img:'jacket-leather', price:148, rating:4.7, reviews:529, tag:'New', colors:['Black'], desc:'Soft vegan leather with silver hardware and a quilted lining.'},
  {id:8, name:'Satin Bomber Jacket', cat:'Outerwear', img:'jacket-bomber', price:112, rating:4.6, reviews:344, colors:['Rust'], desc:'Lightweight satin-finish bomber with ribbed trims and a sleeve pocket.'},
  {id:9, name:'Wool Overcoat', cat:'Outerwear', img:'coat-blue', price:238, was:290, rating:4.8, reviews:301, tag:'Sale', colors:['Blue'], desc:'Soft double-faced wool blend in a long, easy shape. Built for cold commutes.'},
  {id:10, name:'Plaid Longline Coat', cat:'Outerwear', img:'coat-plaid', price:198, rating:4.5, reviews:176, colors:['Plaid'], desc:'Relaxed longline coat in a deep windowpane check. Fully lined.'},
  {id:11, name:'Straight Jeans', cat:'Bottoms', img:'jeans', price:84, rating:4.6, reviews:1760, colors:['Denim'], desc:'Mid-rise, straight leg, rigid denim with a touch of stretch.'},
  {id:12, name:'Wide-Leg Stripe Trousers', cat:'Bottoms', img:'trousers-stripe', price:92, rating:4.7, reviews:518, tag:'Bestseller', colors:['Stripe'], desc:'High-rise, super-wide leg with a pinstripe that moves beautifully.'},
  {id:13, name:'Sunshine Fleece Set', cat:'Bottoms', img:'set-yellow', price:96, was:120, rating:4.8, reviews:887, tag:'Sale', colors:['Yellow'], desc:'Cropped hoodie and matching joggers in plush brushed fleece.'},
  {id:14, name:'Floral Wrap Dress', cat:'Dresses', img:'dress-floral', price:96, rating:4.7, reviews:915, tag:'Bestseller', colors:['Floral'], desc:'A flattering wrap silhouette in a fluid floral print. Easy from desk to dinner.'},
  {id:16, name:'Tailored Check Blazer', cat:'Outerwear', img:'blazer-check', price:168, rating:4.6, reviews:263, tag:'New', colors:['Blue'], desc:'A sharp, lightly structured blazer in a soft windowpane check. Half-lined for easy wear.'},
  {id:15, name:'Embroidered Belted Dress', cat:'Dresses', img:'dress-red', price:128, rating:4.9, reviews:402, tag:'New', colors:['Red'], desc:'Full-skirted dress with delicate embroidery and a woven belt.'}
];

const CATEGORIES = ['All', ...new Set(PRODUCTS.map(p => p.cat))];
const FREE_SHIP = 75, SHIP_COST = 6.95;

/* ---------- Helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = n => '$' + n.toFixed(2);
const byId = id => PRODUCTS.find(p => p.id === id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stars = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

/* ---------- Product photos ---------- */
const photo = (p, cls = '') =>
  `<img src="img/${p.img}.jpg" alt="${esc(p.name)}"${cls ? ` class="${cls}"` : ''}>`;

/* ---------- State ---------- */
let cart = load('tc_cart', []);       // [{id,color,size,qty}]
let wish = load('tc_wish', []);       // [id]
let state = { cat: 'All', sort: 'featured', q: '', maxPrice: 250, saleOnly: false };
let recent = load('tc_recent', []);   // [id], most recent first
let promo = load('tc_promo', null);   // 'WELCOME10' | 'FREESHIP' | null
const PROMOS = {
  WELCOME10: {label: '10% off', pct: .10},
  FREESHIP:  {label: 'free shipping', freeShip: true}
};
let modalState = null;
let lastFocus = null;

/* ---------- Rendering: products ---------- */
function cardHTML(p, i = 0) {
  const liked = wish.includes(p.id);
  const dots = p.colors.map(c => `<span class="dot" title="${c}" style="background:${COLORS[c]}"></span>`).join('');
  const tag = p.tag ? `<span class="tag ${p.tag === 'Sale' ? 'sale' : ''}">${p.tag}</span>` : '';
  const price = p.was ? `${money(p.price)}<s>${money(p.was)}</s>` : money(p.price);
  return `<article class="card" style="animation-delay:${Math.min(i, 8) * 40}ms">
    <div class="card-media" data-open="${p.id}">
      ${photo(p)}
      ${tag}
      <button class="heart ${liked ? 'on' : ''}" data-wish="${p.id}" aria-label="${liked ? 'Remove from' : 'Add to'} wishlist" aria-pressed="${liked}">
        <svg viewBox="0 0 24 24" stroke-linejoin="round"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>
      </button>
      <button class="quick" data-open="${p.id}">Quick add</button>
    </div>
    <div class="card-info">
      <div class="card-row"><span class="card-title">${esc(p.name)}</span><span class="price">${price}</span></div>
      <div class="rating" aria-label="${p.rating} out of 5">${stars(p.rating)}<small>(${p.reviews.toLocaleString()})</small></div>
      <div class="dots">${dots}</div>
    </div>
  </article>`;
}

function filtered() {
  const q = state.q.trim().toLowerCase();
  let list = PRODUCTS.filter(p =>
    (state.cat === 'All' || p.cat === state.cat) &&
    p.price <= state.maxPrice && (!state.saleOnly || p.was) &&
    (!q || (p.name + ' ' + p.cat + ' ' + p.desc + ' ' + p.colors.join(' ')).toLowerCase().includes(q))
  );
  if (state.sort === 'low') list.sort((a, b) => a.price - b.price);
  if (state.sort === 'high') list.sort((a, b) => b.price - a.price);
  if (state.sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  return list;
}

function renderGrid() {
  const list = filtered();
  $('#grid').innerHTML = list.map(cardHTML).join('');
  $('#empty').hidden = list.length > 0;
  $('#resultCount').textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
  $$('.chip').forEach(c => {
    const on = c.dataset.cat === state.cat;
    c.classList.toggle('active', on);
    c.setAttribute('aria-selected', on);
  });
}

function renderChips() {
  $('#chips').innerHTML = CATEGORIES.map(c =>
    `<button class="chip" role="tab" data-cat="${c}">${c}</button>`).join('');
}

function renderFeatured() {
  $('#featuredGrid').innerHTML = PRODUCTS.filter(p => p.tag === 'Bestseller').map(cardHTML).join('');
}

function renderRecent() {
  const list = recent.map(byId).filter(Boolean).slice(0, 4);
  $('#recentWrap').hidden = list.length === 0;
  $('#recentGrid').innerHTML = list.map(cardHTML).join('');
}

function refreshCards() { renderGrid(); renderFeatured(); renderRecent(); }

/* ---------- Cart ---------- */
const cartCount = () => cart.reduce((n, l) => n + l.qty, 0);
const subtotal = () => cart.reduce((s, l) => s + byId(l.id).price * l.qty, 0);
function totals() {
  const sub = subtotal();
  const pr = PROMOS[promo];
  const disc = pr?.pct ? +(sub * pr.pct).toFixed(2) : 0;
  const ship = sub === 0 ? 0 : (sub - disc >= FREE_SHIP || pr?.freeShip) ? 0 : SHIP_COST;
  return {sub, disc, ship, total: sub - disc + ship};
}

function renderCart() {
  const n = cartCount();
  const badge = $('#cartCount');
  badge.hidden = n === 0; badge.textContent = n;

  const {sub, disc, ship, total} = totals();
  $('#subtotal').textContent = money(sub);
  $('#discountRow').hidden = !disc;
  $('#discCode').textContent = promo || '';
  $('#discount').textContent = '−' + money(disc);
  $('#shipping').textContent = sub === 0 ? '—' : ship === 0 ? 'Free' : money(ship);
  $('#total').textContent = money(total);
  $('#shipBar').style.width = Math.min(100, (sub - disc) / FREE_SHIP * 100) + '%';
  $('#shipMsg').textContent = (sub - disc >= FREE_SHIP || PROMOS[promo]?.freeShip)
    ? '🎉 You’ve unlocked free shipping!'
    : `You’re ${money(FREE_SHIP - (sub - disc))} away from free shipping`;
  $('#checkoutBtn').disabled = n === 0;
  $('#checkoutBtn').style.opacity = n === 0 ? .5 : 1;

  $('#cartItems').innerHTML = n === 0
    ? `<div class="drawer-empty"><p>Your cart is empty.</p><button class="btn btn-primary" data-close data-go="#shop">Start shopping</button></div>`
    : cart.map((l, i) => {
        const p = byId(l.id);
        return `<div class="line">
          <div class="thumb">${photo(p)}</div>
          <div>
            <h4>${esc(p.name)}</h4>
            <p class="meta">${esc(l.color)} · ${esc(l.size)}</p>
            <div class="qty">
              <button data-qty="${i}" data-d="-1" aria-label="Decrease quantity">−</button>
              <span>${l.qty}</span>
              <button data-qty="${i}" data-d="1" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="right"><strong>${money(p.price * l.qty)}</strong><button class="link" data-rm="${i}">Remove</button></div>
        </div>`;
      }).join('');
  save('tc_cart', cart);
  save('tc_promo', promo);
}

function flyToCart() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const src = $('#mArt img'); const dst = $('#cartToggle');
  if (!src || !dst) return;
  const a = src.getBoundingClientRect(), b = dst.getBoundingClientRect();
  const el = document.createElement('img');
  el.src = src.src; el.className = 'fly'; el.alt = '';
  el.style.left = (a.left + a.width / 2 - 45) + 'px'; el.style.top = (a.top + a.height / 2 - 55) + 'px';
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = `translate(${b.left + 10 - a.left - a.width / 2}px,${b.top - a.top - a.height / 2}px) scale(.2) rotate(20deg)`;
    el.style.opacity = '.2';
  });
  setTimeout(() => el.remove(), 850);
}
function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

function addToCart(id, color, size) {
  const ex = cart.find(l => l.id === id && l.color === color && l.size === size);
  if (ex) ex.qty++; else cart.push({id, color, size, qty: 1});
  renderCart(); bump($('#cartCount'));
}

/* ---------- Wishlist ---------- */
function renderWish() {
  const badge = $('#wishCount');
  badge.hidden = wish.length === 0; badge.textContent = wish.length;
  $('#wishItems').innerHTML = wish.length === 0
    ? `<div class="drawer-empty"><p>Tap the heart on any item to save it here.</p></div>`
    : wish.map(id => {
        const p = byId(id);
        return `<div class="line">
          <div class="thumb">${photo(p)}</div>
          <div><h4>${esc(p.name)}</h4><p class="meta">${money(p.price)}</p>
            <button class="link" data-open="${p.id}" data-fromwish>Choose options</button></div>
          <div class="right"><span></span><button class="link" data-wish="${p.id}">Remove</button></div>
        </div>`;
      }).join('');
  save('tc_wish', wish);
}

function toggleWish(id) {
  wish = wish.includes(id) ? wish.filter(x => x !== id) : [...wish, id];
  renderWish(); refreshCards();
  $$(`.heart[data-wish="${id}"]`).forEach(h => h.classList.add('pop'));
  toast(wish.includes(id) ? 'Saved to wishlist' : 'Removed from wishlist');
}

/* ---------- Drawers / modal ---------- */
const overlay = $('#overlay');
function openDrawer(el) {
  closeAll(true);
  lastFocus = document.activeElement;
  el.classList.add('open'); el.setAttribute('aria-hidden', 'false');
  overlay.hidden = false; document.body.style.overflow = 'hidden';
  $('button', el)?.focus();
}
function closeAll(keepFocus) {
  $$('.drawer').forEach(d => { d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); });
  $$('.modal').forEach(m => m.hidden = true); overlay.hidden = true; document.body.style.overflow = '';
  if (!keepFocus) lastFocus?.focus?.();
}

function openModal(id) {
  const p = byId(id);
  modalState = {p, color: p.colors[0], size: null};
  lastFocus = document.activeElement;
  closeAll(true);
  $('#mCat').textContent = p.cat;
  $('#mTitle').textContent = p.name;
  $('#mRating').innerHTML = `${stars(p.rating)}<small>${p.rating} (${p.reviews.toLocaleString()} reviews)</small>`;
  $('#mPrice').innerHTML = p.was ? `${money(p.price)}<s>${money(p.was)}</s>` : money(p.price);
  $('#mDesc').textContent = p.desc;
  $('#mSizes').innerHTML = SIZES.map(s => `<button class="size" data-size="${s}">${s}</button>`).join('');
  $('#mError').textContent = '';
  renderModalColor();
  const rel = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id);
  const more = PRODUCTS.filter(x => x.cat !== p.cat && x.id !== p.id && x.tag === 'Bestseller');
  const picks = [...rel, ...more].slice(0, 3);
  $('#mRelated').innerHTML = `<h4>You may also like</h4><div class="related-row">${picks.map(x =>
    `<button class="rel" data-open="${x.id}">${photo(x)}<span>${esc(x.name)}</span><b>${money(x.price)}</b></button>`).join('')}</div>`;
  $('.modal-box', $('#modal')).scrollTop = 0;
  renderReviews();
  recent = [p.id, ...recent.filter(x => x !== p.id)].slice(0, 8); save('tc_recent', recent);
  renderRecent();
  $('#modal').hidden = false; document.body.style.overflow = 'hidden';
  $('.modal-x').focus();
}
function renderModalColor() {
  const {p, color} = modalState;
  $('#mArt').innerHTML = photo(p);
  $('#mColorName').textContent = color;
  $('#mColors').innerHTML = p.colors.map(c =>
    `<button class="swatch ${c === color ? 'on' : ''}" data-color="${c}" style="background:${COLORS[c]}" aria-label="${c}" aria-pressed="${c === color}"></button>`).join('');
}

let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- Reviews ---------- */
const REV_POOL = [
  [5,'Exactly what I hoped for','Fits true to size and the fabric feels great. Already thinking about a second one.','Maya R.','Verified buyer'],
  [5,'Love it','Great quality for the price. Washed it a few times and it still looks brand new.','Jordan T.','Verified buyer'],
  [4,'Really good, runs a touch large','Lovely piece. I’d size down if you want a closer fit, otherwise no complaints.','Priya S.','Verified buyer'],
  [5,'Compliments everywhere','Wore it out last weekend and got asked where it’s from three times.','Leo M.','Verified buyer'],
  [4,'Solid and comfortable','Well made and comfortable all day. Colour is slightly different in person but I like it.','Sam K.','Verified buyer'],
  [3,'Good, not perfect','Nice design but the sleeves were a bit long for me. Delivery was fast though.','Alex P.','Verified buyer'],
  [5,'Worth every penny','Heavier and nicer than I expected. Easy returns policy gave me confidence to try it.','Nora B.','Verified buyer'],
  [4,'Great everyday piece','Goes with everything I own. Would buy again in another colour.','Chris D.','Verified buyer']
];
let userRevs = load('tc_reviews', {});   // {productId: [{r,t,b,n,d}]}
let draftRating = 0;

function sampleReviews(p) {
  return [0, 1, 2, 3].map(k => {
    const [r, t, b, n, v] = REV_POOL[(p.id * 3 + k * 2) % REV_POOL.length];
    return {r, t, b, n, v, d: `${2 + (p.id + k * 5) % 27} days ago`};
  });
}
function distribution(p) {
  const w = [5, 4, 3, 2, 1].map(st => Math.exp(-Math.pow(st - (p.rating + .45), 2) / 1.1));
  const tot = w.reduce((a, b) => a + b, 0);
  return w.map(x => Math.round(x / tot * 100));
}
function renderReviews() {
  const p = modalState.p;
  const mine = userRevs[p.id] || [];
  const all = [...mine.map(x => ({...x, v: 'You'})), ...sampleReviews(p)];
  const dist = distribution(p);
  $('#mReviews').innerHTML = `
    <h4>Customer reviews</h4>
    <div class="rev-sum">
      <div class="rev-big"><b>${p.rating.toFixed(1)}</b><div class="rating">${stars(p.rating)}</div><small>${(p.reviews + mine.length).toLocaleString()} ratings</small></div>
      <div class="rev-bars">${dist.map((pc, i) => `<div class="rev-bar"><span>${5 - i}</span><i style="--w:${pc}%"></i><span>${pc}%</span></div>`).join('')}</div>
    </div>
    <p class="rev-note">Sample reviews for this demo store.</p>
    ${all.map(x => `<div class="rev">
      <div class="rev-top"><b>${esc(x.n)}</b><span>${esc(x.d)}</span></div>
      <div class="rating">${stars(x.r)} <span class="verified">${esc(x.v)}</span></div>
      <h5>${esc(x.t)}</h5><p>${esc(x.b)}</p></div>`).join('')}
    <form class="rev-form" id="revForm" novalidate>
      <h4>Write a review</h4>
      <div class="star-pick" id="starPick" role="radiogroup" aria-label="Your rating">
        ${[1, 2, 3, 4, 5].map(n => `<button type="button" data-star="${n}" role="radio" aria-label="${n} star${n > 1 ? 's' : ''}">★</button>`).join('')}
      </div>
      <input name="n" placeholder="Your name" maxlength="40" aria-label="Your name">
      <input name="t" placeholder="Review title" maxlength="80" aria-label="Review title">
      <textarea name="b" rows="3" placeholder="What did you think?" maxlength="500" aria-label="Review"></textarea>
      <p class="error" id="revErr" role="alert"></p>
      <button class="btn btn-primary" type="submit">Submit review</button>
    </form>`;
  draftRating = 0;
}
function paintStars(n) { $$('#starPick button').forEach(b => b.classList.toggle('on', +b.dataset.star <= n)); }

document.addEventListener('click', e => {
  const st = e.target.closest('[data-star]');
  if (st) { draftRating = +st.dataset.star; paintStars(draftRating); }
});
document.addEventListener('mouseover', e => {
  const st = e.target.closest('[data-star]');
  if (st) paintStars(+st.dataset.star);
});
document.addEventListener('mouseout', e => { if (e.target.closest('[data-star]')) paintStars(draftRating); });
document.addEventListener('submit', e => {
  if (e.target.id !== 'revForm') return;
  e.preventDefault();
  const f = e.target, err = $('#revErr');
  if (!draftRating) { err.textContent = 'Please choose a star rating.'; return; }
  if (!f.t.value.trim() || f.b.value.trim().length < 5) { err.textContent = 'Please add a title and a short review.'; return; }
  const id = modalState.p.id;
  userRevs[id] = [{r: draftRating, t: f.t.value.trim(), b: f.b.value.trim(), n: f.n.value.trim() || 'Anonymous', d: 'Just now'}, ...(userRevs[id] || [])];
  save('tc_reviews', userRevs);
  renderReviews();
  toast('Thanks — your review was added');
});

/* ---------- Events ---------- */
document.addEventListener('click', e => {
  const t = e.target;

  const wishBtn = t.closest('[data-wish]');
  if (wishBtn) { e.stopPropagation(); return toggleWish(+wishBtn.dataset.wish); }

  const open = t.closest('[data-open]');
  if (open) { e.preventDefault(); return openModal(+open.dataset.open); }

  const chip = t.closest('[data-cat]');
  if (chip) {
    state.cat = chip.dataset.cat === 'all' ? 'All' : chip.dataset.cat;
    renderGrid();
    if (chip.matches('.cat-tile')) $('#shop').scrollIntoView({behavior: 'smooth'});
    return;
  }

  const qty = t.closest('[data-qty]');
  if (qty) {
    const l = cart[+qty.dataset.qty]; l.qty += +qty.dataset.d;
    if (l.qty <= 0) cart.splice(+qty.dataset.qty, 1);
    return renderCart();
  }
  const rm = t.closest('[data-rm]');
  if (rm) { cart.splice(+rm.dataset.rm, 1); return renderCart(); }

  const close = t.closest('[data-close]');
  if (close) {
    const sm = close.closest('#sizeModal');
    if (sm) { sm.hidden = true; return; }
    closeAll();
    if (close.dataset.go) $(close.dataset.go).scrollIntoView({behavior: 'smooth'});
    return;
  }

  if (t === overlay || t.classList.contains('modal')) { if (t.id === 'sizeModal') { t.hidden = true; return; } return closeAll(); }

  if (modalState) {
    const sw = t.closest('[data-color]');
    if (sw) { modalState.color = sw.dataset.color; return renderModalColor(); }
    const sz = t.closest('[data-size]');
    if (sz) {
      modalState.size = sz.dataset.size;
      $$('.size').forEach(b => b.classList.toggle('on', b === sz));
      $('#mError').textContent = '';
    }
  }
});

$('#mAdd').addEventListener('click', () => {
  if (!modalState.size) { $('#mError').textContent = 'Please select a size.'; const z = $('#mSizes'); z.classList.remove('shake'); void z.offsetWidth; z.classList.add('shake'); return; }
  flyToCart();
  addToCart(modalState.p.id, modalState.color, modalState.size);
  setTimeout(() => { closeAll(true); openDrawer($('#cartDrawer')); }, 700);
});

$('#cartToggle').addEventListener('click', () => openDrawer($('#cartDrawer')));
$('#wishToggle').addEventListener('click', () => openDrawer($('#wishDrawer')));
$('#searchToggle').addEventListener('click', () => {
  const bar = $('#searchbar'); bar.hidden = !bar.hidden;
  if (!bar.hidden) $('#searchInput').focus();
});
$('#searchInput').addEventListener('input', e => {
  state.q = e.target.value;
  renderGrid();
  if (state.q) $('#shop').scrollIntoView({behavior: 'smooth'});
});
$('#sort').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

$('#checkoutBtn').addEventListener('click', () => {
  if (!cart.length) return;
  const {sub, disc, ship, total} = totals();
  const row = (k, v, c = '') => `<div class="row ${c}"><span>${k}</span><span>${v}</span></div>`;
  $('#checkoutSummary').innerHTML =
    row(`${cartCount()} item${cartCount() === 1 ? '' : 's'}`, money(sub)) +
    (disc ? row(`Discount (${promo})`, '−' + money(disc)) : '') +
    row('Shipping', ship ? money(ship) : 'Free') + row('Total', money(total), 't');
  $('#checkoutForm').hidden = false; $('#orderDone').hidden = true; $('#coError').textContent = '';
  closeAll(true);
  $('#checkoutModal').hidden = false; overlay.hidden = false; document.body.style.overflow = 'hidden';
  $('#checkoutForm input').focus();
});

$('#checkoutForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target; let ok = true;
  $$('input', f).forEach(i => {
    const bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value));
    i.classList.toggle('bad', bad); if (bad) ok = false;
  });
  if (!ok) { $('#coError').textContent = 'Please complete all fields with valid details.'; return; }
  const num = 'TC-' + Math.floor(100000 + Math.random() * 900000);
  $('#orderMsg').textContent = `Order ${num} is confirmed. A receipt would be emailed to ${f.email.value.trim()}. (Demo — nothing was charged.)`;
  f.hidden = true; $('#orderDone').hidden = false;
  cart = []; promo = null; renderCart(); f.reset();
});

$('#promoForm').addEventListener('submit', e => {
  e.preventDefault();
  const code = $('#promoInput').value.trim().toUpperCase();
  const msg = $('#promoMsg');
  if (!code) return;
  if (PROMOS[code]) { promo = code; msg.className = 'promo-msg ok'; msg.textContent = `Code applied: ${PROMOS[code].label}.`; $('#promoInput').value = ''; }
  else { msg.className = 'promo-msg bad'; msg.textContent = 'That code isn’t valid. Try WELCOME10.'; }
  renderCart();
});

/* ---------- Filters ---------- */
function syncFilters() {
  $('#priceVal').textContent = '$' + state.maxPrice;
  $('#priceRange').value = state.maxPrice; $('#saleOnly').checked = state.saleOnly;
}
function resetFilters() { state = {...state, cat: 'All', q: '', maxPrice: 250, saleOnly: false}; $('#searchInput').value = ''; syncFilters(); renderGrid(); }
$('#priceRange').addEventListener('input', e => { state.maxPrice = +e.target.value; syncFilters(); renderGrid(); });
$('#saleOnly').addEventListener('change', e => { state.saleOnly = e.target.checked; renderGrid(); });
$('#resetFilters').addEventListener('click', resetFilters);
$('#emptyReset').addEventListener('click', resetFilters);
$('#saleBtn').addEventListener('click', () => {
  state.cat = 'All'; state.saleOnly = true; syncFilters(); renderGrid();
  $('#shop').scrollIntoView({behavior: 'smooth'});
});
$('#sizeGuideBtn').addEventListener('click', () => { $('#sizeModal').hidden = false; });

/* ---------- Theme ---------- */
$('#themeToggle').addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('tc_theme', next); } catch {}
});

/* ---------- Sale countdown ---------- */
let saleEnd = +load('tc_sale_end', 0);
if (!saleEnd || saleEnd < Date.now()) { saleEnd = Date.now() + 3 * 864e5; save('tc_sale_end', saleEnd); }
function tick() {
  let d = Math.max(0, saleEnd - Date.now()) / 1000;
  const parts = [Math.floor(d / 86400), Math.floor(d % 86400 / 3600), Math.floor(d % 3600 / 60), Math.floor(d % 60)];
  ['cdD', 'cdH', 'cdM', 'cdS'].forEach((id, i) => $('#' + id).textContent = String(parts[i]).padStart(2, '0'));
}
tick(); setInterval(tick, 1000);

$('#newsForm').addEventListener('submit', e => {
  e.preventDefault();
  const v = $('#newsEmail').value.trim();
  const msg = $('#newsMsg');
  if (!/^\S+@\S+\.\S+$/.test(v)) { msg.textContent = 'Please enter a valid email address.'; return; }
  msg.textContent = 'Thanks! Use code WELCOME10 at checkout for 10% off.';
  e.target.reset();
});

/* ---------- Image fallback + scroll reveal ---------- */
document.addEventListener('error', e => {
  if (e.target.tagName === 'IMG') { e.target.style.visibility = 'hidden'; }
}, true);

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), {threshold: .12})
  : null;
$$('.section-head, .sale, .faq details, .look, .perks-grid > div, .about > *, .categories .cat-tile').forEach(el => {
  el.classList.add('reveal'); io ? io.observe(el) : el.classList.add('in');
});

/* ---------- Motion ---------- */

// scroll progress + header shadow
const prog = $('#progress'), hdr = $('.header');
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
    hdr.classList.toggle('scrolled', scrollY > 10);
    ticking = false;
  });
}, {passive: true});

// hero parallax follows the pointer
const heroArt = $('.hero-art');
if (matchMedia('(hover: hover)').matches) {
  $('.hero').addEventListener('mousemove', e => {
    const r = heroArt.getBoundingClientRect();
    heroArt.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(2));
    heroArt.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(2));
  });
}

// button ripple
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('.btn'); if (!b) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
  const s = document.createElement('span'); s.className = 'ripple';
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
  b.appendChild(s); setTimeout(() => s.remove(), 650);
});

// mobile menu
const menuBtn = $('#menuToggle'), nav = $('#mainNav');
function setMenu(open) { nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); }
menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// back to top
const toTop = $('#toTop');
addEventListener('scroll', () => { toTop.hidden = scrollY < 900; }, {passive: true});
toTop.addEventListener('click', () => scrollTo({top: 0, behavior: 'smooth'}));

/* ---------- Boutique layer ---------- */
const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// loader: curtains open once the "stitching" is done
(function () {
  const loader = $('#loader');
  if (!loader) return;
  if (reduced) { loader.remove(); return; }
  document.body.classList.add('loading');
  setTimeout(() => {
    loader.classList.add('done'); document.body.classList.remove('loading');
    setTimeout(() => loader.remove(), 1300);
  }, 1900);
})();

// build your look
const SLOTS = {Tops: 0, Outerwear: 0, Bottoms: 0};
const slotItems = cat => PRODUCTS.filter(p => p.cat === cat);
function renderLook() {
  let total = 0;
  $$('.slot').forEach(el => {
    const cat = el.dataset.slot, list = slotItems(cat), p = list[SLOTS[cat] % list.length];
    total += p.price;
    $('.slot-img', el).innerHTML = photo(p);
    $('.slot-meta', el).innerHTML = `<b>${esc(p.name)}</b><span>${money(p.price)}</span>`;
  });
  $('#lookTotal').textContent = money(total);
}
$$('.slot-ctl button').forEach(b => b.addEventListener('click', () => {
  const cat = b.closest('.slot').dataset.slot, n = slotItems(cat).length;
  SLOTS[cat] = (SLOTS[cat] + +b.dataset.dir + n) % n;
  renderLook();
}));
$('#lookShuffle').addEventListener('click', () => {
  Object.keys(SLOTS).forEach(c => SLOTS[c] = Math.floor(Math.random() * slotItems(c).length));
  renderLook();
});
$('#lookAdd').addEventListener('click', () => {
  const size = $('#lookSize').value;
  Object.keys(SLOTS).forEach(c => {
    const list = slotItems(c), p = list[SLOTS[c] % list.length];
    addToCart(p.id, p.colors[0], size);
  });
  toast('Look added to your cart');
  openDrawer($('#cartDrawer'));
});
renderLook();

// scroll reveal for the new pieces
$$('.hang, .slot, .look-total').forEach((el, i) => {
  el.classList.add('reveal'); el.style.transitionDelay = (i % 4) * 80 + 'ms';
  io ? io.observe(el) : el.classList.add('in');
});
$$('.polaroid, .postcard, .care-label').forEach(el => {
  el.classList.add('fadein');
  io ? io.observe(el) : el.classList.add('in');
});

/* ---------- Init ---------- */
// drop any stale saved items
cart = cart.filter(l => byId(l.id)); wish = wish.filter(byId); if (!PROMOS[promo]) promo = null;
renderChips(); renderGrid(); renderFeatured(); renderRecent(); renderCart(); renderWish(); syncFilters();
})();
