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
    const phone   = '573003150038';
    const message = encodeURIComponent('Hola 👋, quiero información y asesoría sobre sus perfumes.');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
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
        active:      getValue(data, index, 9,  'No'),
        image:       getValue(data, index, 10, ''),
        description: getValue(data, index, 11, '')
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
