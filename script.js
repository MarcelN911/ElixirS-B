// ============================================
// SCRIPT.JS — Elixir S&B
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
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('active');
    document.getElementById('mobileOverlay').classList.remove('active');
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

// ── Cookie Banner ─────────────────────────────

/**
 * Injects a GDPR/Habeas Data cookie notice banner once per user.
 * The user's acceptance is saved in localStorage so it only shows once.
 * CSS is injected dynamically so no extra stylesheet link is needed.
 */
function setupCookieBanner() {
    if (localStorage.getItem('elixir_cookies_ok')) {
        return;
    }

    const style = document.createElement('style');
    style.textContent = `
        .cookie-banner {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 9999;
            background: rgba(12, 15, 35, 0.97);
            border-top: 1px solid rgba(212, 175, 125, 0.2);
            padding: 14px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }
        .cookie-banner p {
            font-family: 'Montserrat', sans-serif;
            font-size: 12px;
            font-weight: 300;
            color: rgba(255,255,255,0.6);
            line-height: 1.65;
            margin: 0;
            flex: 1;
            min-width: 200px;
        }
        .cookie-banner a {
            color: rgba(212,175,125,0.85);
            text-decoration: none;
            border-bottom: 1px solid rgba(212,175,125,0.3);
            transition: color 0.2s;
        }
        .cookie-banner a:hover { color: white; }
        .cookie-banner-btn {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            background: rgba(212,175,125,0.12);
            border: 1px solid rgba(212,175,125,0.4);
            color: rgba(212,175,125,0.9);
            padding: 10px 22px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .cookie-banner-btn:hover {
            background: rgba(212,175,125,0.28);
            color: white;
        }
    `;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.id = 'cookieBanner';
    banner.innerHTML = `
        <p>
            Usamos servicios externos (Google Fonts, Google Sheets) para el funcionamiento de la tienda.
            Al navegar, aceptas el uso de cookies y servicios de terceros.
            <a href="privacidad.html">Ver política de privacidad</a>.
        </p>
        <button class="cookie-banner-btn" onclick="acceptCookies()">Aceptar</button>`;
    document.body.appendChild(banner);
}

/** Saves the user's acceptance and removes the banner from the DOM. */
function acceptCookies() {
    localStorage.setItem('elixir_cookies_ok', '1');
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.remove();
}

setupCookieBanner();
