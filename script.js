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
}

function closeBasket() {
    document.getElementById('cartPanel').classList.remove('active');
}