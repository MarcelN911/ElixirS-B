// ============================================
// SCRIPT.JS — ScentScape
// Shared code loaded on every page:
// data URLs, helper functions, mobile menu,
// cart panel open/close, WhatsApp contact
// ============================================

// --- API URLs ---
const _host       = window.location.hostname;
const _apiBase    = (_host === 'localhost' || _host === '127.0.0.1' || _host === '')
    ? 'http://localhost:3000'
    : 'https://nexomar.co';
const _shopId     = '6a0de7a797ebb49fffb11079';
const productsUrl = _apiBase + '/api/products/public?userId=' + _shopId;
const reviewsUrl  = _apiBase + '/api/shop-reviews/public?userId=' + _shopId;

// ── Wishlist Overlay ──────────────────────────────

function elixirUpdateWishBadge() {
    const count = Object.keys(getHearts()).length;
    ['elixirWishBadge', 'elixirWishBadgeMobile'].forEach(function(id) {
        const badge = document.getElementById(id);
        if (!badge) return;
        badge.textContent = count;
        badge.classList.toggle('hidden', count === 0);
    });
}

async function elixirOpenWishlist() {
    const overlay = document.getElementById('elixirWishOverlay');
    const body    = document.getElementById('elixirWishBody');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    requestAnimationFrame(function() { overlay.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const ids = Object.keys(getHearts());
    if (!ids.length) {
        body.innerHTML = '<div style="text-align:center;padding:60px 24px;color:rgba(212,175,125,0.6)">' +
            '<div style="font-size:32px;margin-bottom:12px">🤍</div>' +
            '<div style="font-family:\'Cormorant Garamond\',serif;font-style:italic;font-size:20px;color:rgba(212,175,125,0.8)">Sin favoritos aún</div>' +
            '<div style="font-size:12px;margin-top:8px;line-height:1.6">Presiona el corazón en los productos<br>que más te gusten.</div>' +
        '</div>';
        return;
    }

    body.innerHTML = '<div style="padding:20px 24px;color:rgba(255,255,255,0.4);font-size:13px">Cargando...</div>';
    try {
        const res      = await fetch(productsUrl);
        const all      = await res.json();
        const hearted  = all.filter(function(p) { return ids.includes(p._id); });
        if (!hearted.length) { body.innerHTML = ''; return; }

        body.innerHTML = hearted.map(function(p) {
            const img   = p.imagenes && p.imagenes[0] ? p.imagenes[0] : '';
            const price = '$' + Math.round(p.precio || 0).toLocaleString('es-CO') + ' COP';
            return '<a href="producto.html?id=' + p._id + '" style="display:flex;align-items:center;gap:14px;padding:14px 24px;border-bottom:1px solid rgba(212,175,125,0.1);text-decoration:none;color:inherit;transition:background 0.15s" onmouseenter="this.style.background=\'rgba(255,255,255,0.04)\'" onmouseleave="this.style.background=\'transparent\'">' +
                (img ? '<img src="' + img + '" style="width:52px;height:65px;object-fit:cover;object-position:center top;flex-shrink:0;border-radius:3px">' : '<div style="width:52px;height:65px;background:#1a1020;flex-shrink:0;border-radius:3px"></div>') +
                '<div style="flex:1;min-width:0">' +
                    '<div style="font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#e0d0b0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (p.nombre || '') + '</div>' +
                    '<div style="font-family:\'Cormorant Garamond\',serif;font-style:italic;font-size:11px;color:rgba(212,175,125,0.6);margin-top:2px">' + (p.marca || '') + '</div>' +
                    '<div style="font-family:\'Cormorant Garamond\',serif;font-size:14px;color:var(--gold);margin-top:4px">' + price + '</div>' +
                '</div>' +
                '<button onclick="event.preventDefault();elixirRemoveWish(\'' + p._id + '\',this.closest(\'a\'))" style="background:none;border:none;color:rgba(212,175,125,0.4);font-size:16px;cursor:pointer;padding:6px;flex-shrink:0;transition:color 0.2s" onmouseenter="this.style.color=\'#e8455a\'" onmouseleave="this.style.color=\'rgba(212,175,125,0.4)\'">✕</button>' +
            '</a>';
        }).join('');
    } catch (e) {}
}

function elixirCloseWishlist() {
    const overlay = document.getElementById('elixirWishOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    setTimeout(function() { overlay.classList.add('hidden'); }, 400);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
}

function elixirRemoveWish(productId, el) {
    const h = getHearts();
    delete h[productId];
    localStorage.setItem(HEARTS_KEY, JSON.stringify(h));
    if (el) el.remove();
    elixirUpdateWishBadge();
}

document.addEventListener('DOMContentLoaded', function() {
    elixirUpdateWishBadge();
    ['wishlistBtn', 'wishlistBtnMobile'].forEach(function(id) {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', elixirOpenWishlist);
    });
    const overlay = document.getElementById('elixirWishOverlay');
    if (overlay) overlay.addEventListener('click', function(e) {
        if (e.target === overlay || e.target.classList.contains('elixir-wish-backdrop')) elixirCloseWishlist();
    });
});

// ── Heart / Wishlist ──────────────────────────────

const HEARTS_KEY = 'elixir_hearts';

function getHearts() {
    try { return JSON.parse(localStorage.getItem(HEARTS_KEY) || '{}'); } catch (_) { return {}; }
}

function isHearted(productId) { return !!getHearts()[productId]; }

async function heartProduct(productId) {
    if (isHearted(productId)) return false;
    try {
        await fetch(_apiBase + '/api/products/' + productId + '/heart', { method: 'POST' });
        const h = getHearts();
        h[productId] = true;
        localStorage.setItem(HEARTS_KEY, JSON.stringify(h));
        return true;
    } catch (_) { return false; }
}

// --- Pagination state (shared with products.js) ---
let data = [];
let showProducts = 0;
const productsPerLoad = 20;

// ── WhatsApp ──────────────────────────────────

/**
 * Opens WhatsApp with a pre-filled greeting message.
 * Used by the floating WhatsApp button on every page.
 */
function openWhatsAppContact() {
    const phone   = '573218101882';
    const message = encodeURIComponent('Hola, quiero información y asesoría sobre sus perfumes.');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}

// ── Data Helpers ──────────────────────────────

/**
 * Derives the badge label from a product's tags and sale price.
 * Priority: Nuevo > Sale/Oferta > sale price.
 */
function deriveBadge(p) {
    var tags = Array.isArray(p.tags) ? p.tags : [];
    if (tags.includes('Nuevo'))        return 'Nuevo';
    if (tags.includes('Más vendido')) return 'Más vendido';
    if (tags.includes('Oferta'))     return 'Sale';
    var hasSale = (p.precioSale && p.precioSale > 0) ||
        (p.presentaciones && p.presentaciones.some(function(pr) { return pr.precioSale > 0; }));
    if (hasSale) return 'Sale';
    return '';
}

function getBrand(p) {
    if (p.marca) return p.marca;
    if (Array.isArray(p.variantes)) {
        var v = p.variantes.find(function(x) { return x.nombre === 'Marca'; });
        if (v && v.opciones && v.opciones[0]) return v.opciones[0];
    }
    return '';
}

function createProductData(data, index) {
    var p = data[index];
    var allPrices = p.presentaciones && p.presentaciones.length > 0
        ? p.presentaciones.map(function(pr) { return pr.precio; })
        : [p.precio];
    var lowestPrice  = allPrices.reduce(function(min, val) { return val < min ? val : min; }, allPrices[0]);
    var multiPrice   = p.presentaciones && p.presentaciones.length > 1;
    var salePrice = p.presentaciones && p.presentaciones.length > 0 && p.presentaciones[0].precioSale > 0
        ? p.presentaciones[0].precioSale
        : (p.precioSale > 0 ? p.precioSale : null);
    var allSizes = p.presentaciones
        ? p.presentaciones.map(function(pr) { return pr.etiqueta; }).join(',')
        : '';
    return {
        id:          p._id,
        name:        p.nombre || 'desconocido',
        brand:       getBrand(p),
        price:       lowestPrice,
        sale:        salePrice,
        size:        allSizes,
        badge:       deriveBadge(p),
        multiPrice:  multiPrice,
        categories:  p.categoria  || '',
        unisex:      p.variantes  ? p.variantes.some(function(v) { return v.nombre === 'Género' && v.opciones.includes('Unisex'); }) : false,
        active:      p.disponible,
        image:       p.imagenes && p.imagenes.length > 0 ? p.imagenes[0] : './assets/img/logo-transparent.png',
        description: p.descripcion || ''
    };
}

/**
 * Returns a string of HTML star icons for a given rating count.
 * Example: createStars(3) → '<span>★</span><span>★</span><span>★</span>'
 */
function createStars(count) {
    let stars = '';
    for (let i = 0; i < count; i++) {
        stars += '<span>★</span>';
    }
    return stars;
}

// ── Mobile Menu ───────────────────────────────

function openMobileMenu() {
    document.getElementById('mobileMenu').classList.add('active');
    document.getElementById('mobileOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('active');
    document.getElementById('mobileOverlay').classList.remove('active');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
}

// Wire up the mobile menu — only runs on pages that have the menu button
const menuButton = document.getElementById('menuButton');
if (menuButton) {
    menuButton.addEventListener('click', openMobileMenu);
    document.getElementById('menuClose').addEventListener('click', closeMobileMenu);
    document.getElementById('mobileOverlay').addEventListener('click', closeMobileMenu);
}

// ── Cart Panel ────────────────────────────────

/**
 * Opens the slide-in cart panel and locks page scrolling.
 * Both `body` and `html` must be locked for iOS Safari to work correctly.
 */
function openBasket() {
    document.getElementById('cartPanel').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
}

/**
 * Closes the cart panel and restores normal page scrolling.
 */
function closeBasket() {
    document.getElementById('cartPanel').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
}

// Wire up cart open/close — only runs on pages that have the cart button
const cartButton = document.getElementById('cartButton');
if (cartButton) {
    cartButton.addEventListener('click', openBasket);
    document.getElementById('cartPanelClose').addEventListener('click', closeBasket);
    document.getElementById('cartOverlay').addEventListener('click', closeBasket);
}
