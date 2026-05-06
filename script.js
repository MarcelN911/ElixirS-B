// ============================================
// SCRIPT.JS — Elixir S&B
// Shared code loaded on every page:
// data URLs, helper functions, mobile menu,
// cart panel open/close, WhatsApp contact
// ============================================

// --- Google Sheets API URLs ---
// These URLs point to two different tabs in the same spreadsheet.
const dbUrl       = `https://docs.google.com/spreadsheets/d/1FiOCY_GIkpCCZVaZplXQtQzwLORYQOws/gviz/tq?tqx=out:json&gid=438421994&headers=1`;
const productsUrl = `https://docs.google.com/spreadsheets/d/1FiOCY_GIkpCCZVaZplXQtQzwLORYQOws/gviz/tq?tqx=out:json&gid=664120326#gid=664120326&headers=1`;

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

// ── Image URL ─────────────────────────────────

/**
 * Converts a Google Drive thumbnail URL into a directly embeddable image URL.
 * Input:  https://drive.google.com/thumbnail?id=FILE_ID&sz=w800
 * Output: https://lh3.googleusercontent.com/d/FILE_ID=w800
 * Returns the placeholder image if the URL is missing or not a Drive URL.
 */
function transformImageUrl(url, width) {
    if (width === undefined) width = 800;
    if (!url) return './assets/img/logo-transparent.png';
    try {
        const parsed = new URL(url);
        if (!parsed.hostname.includes('drive.google.com')) {
            return './assets/img/logo-transparent.png';
        }
        // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
        const pathMatch = parsed.pathname.match(/\/d\/([^/]+)/);
        if (pathMatch) {
            return `https://drive.google.com/thumbnail?id=${pathMatch[1]}&sz=w${width}`;
        }
        // Format: https://drive.google.com/thumbnail?id=FILE_ID&sz=w800
        const fileId = parsed.searchParams.get('id');
        if (fileId) {
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
        }
        return './assets/img/logo-transparent.png';
    } catch (e) {
        return './assets/img/logo-transparent.png';
    }
}

// ── Data Helpers ──────────────────────────────

/**
 * Safely reads a cell value from a Google Sheets row.
 * Returns `fallback` if the cell is empty or missing.
 *
 * Example: getValue(data, 0, 1, 'unknown') reads column 1 of row 0.
 */
function getValue(data, index, column, fallback) {
    if (data[index].c[column]) {
        return data[index].c[column].v;
    }
    return fallback;
}

/**
 * Converts a raw Google Sheets row into a readable product object.
 * Column numbers match the order defined in the spreadsheet.
 */
function createProductData(data, index) {
    return {
        id:          getValue(data, index, 0,  ''),
        name:        getValue(data, index, 1,  'desconocido'),
        brand:       getValue(data, index, 2,  'desconocido'),
        price:       getValue(data, index, 3,  'desconocido'),
        sale:        getValue(data, index, 4,  ''),
        size:        getValue(data, index, 5,  'desconocido'),
        badge:       getValue(data, index, 6,  ''),
        categories:  getValue(data, index, 8,  ''),
        unisex:      getValue(data, index, 9,  'No'),
        active:      getValue(data, index, 10, 'No'),
        image:       transformImageUrl(getValue(data, index, 11, '')),
        description: getValue(data, index, 12, '')
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
