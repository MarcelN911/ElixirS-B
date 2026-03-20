const nav = document.querySelector('nav');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

const menuButton = document.getElementById('menuButton');
const menuClose = document.getElementById('menuClose');
const mobileMenu = document.getElementById('mobileMenu');
const mobileOverlay = document.getElementById('mobileOverlay');

function openMenu() {
    mobileMenu.classList.add('active');
    mobileOverlay.classList.add('active');
    menuButton.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    mobileMenu.classList.remove('active');
    mobileOverlay.classList.remove('active');
    menuButton.classList.remove('active');
    document.body.style.overflow = '';
}

menuButton.addEventListener('click', () => {
    if (mobileMenu.classList.contains('active')) {
        closeMenu();
    } else {
        openMenu();
    }
});

menuClose.addEventListener('click', closeMenu);
mobileOverlay.addEventListener('click', closeMenu);

mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
});

function openBasket() {
    document.getElementById('cartPanel').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeBasket() {
    document.getElementById('cartPanel').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

const cartOverlay = document.getElementById('cartOverlay');
if (cartOverlay) {
    cartOverlay.addEventListener('click', closeBasket);
}

const cartPanelClose = document.getElementById('cartPanelClose');
if (cartPanelClose) {
    cartPanelClose.addEventListener('click', closeBasket);
}

// =============================================================
// SCHRITT 1: Scroll-Animationen (Intersection Observer)
// =============================================================
//
// Ziel: Elemente sollen beim Scrollen sanft einblenden (fade-in + slide-up).
//       Das gibt der Seite sofort Leben und wirkt professionell.
//
// So geht's:
//
// 1. Alle Elemente mit der Klasse "anim-fade-up" auswählen
//    → document.querySelectorAll('.anim-fade-up')
//
// 2. Einen IntersectionObserver erstellen:
//    → Beobachtet, ob ein Element im Viewport sichtbar wird
//    → Wenn ja: füge die Klasse "visible" hinzu
//    → Optionen: { threshold: 0.15 } (15% sichtbar = auslösen)
//
// 3. Im CSS brauchst du zwei Zustände:
//    → .anim-fade-up         { opacity: 0; transform: translateY(30px); transition: opacity 0.6s ease, transform 0.6s ease; }
//    → .anim-fade-up.visible { opacity: 1; transform: translateY(0); }
//
// 4. Für gestaffelte Animationen (staggered):
//    → Nutze data-delay="100", data-delay="200" etc. im HTML
//    → Im Observer: element.style.transitionDelay = element.dataset.delay + 'ms'
//
// 5. Betroffene Elemente im HTML (haben schon die Klasse):
//    → .bestsellers-header
//    → .quote-section
//    → .social-header
//    → .testimonials-header
//
// 6. Optional: Auch .product-card und .testimonial-card animieren,
//    wenn sie in den Viewport scrollen
//
// Tipp: observer.unobserve(entry.target) nach dem Einblenden aufrufen,
//       damit die Animation nur einmal passiert.
// =============================================================