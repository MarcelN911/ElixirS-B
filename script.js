const dbUrl = `https://docs.google.com/spreadsheets/d/1FiOCY_GIkpCCZVaZplXQtQzwLORYQOws/gviz/tq?tqx=out:json&gid=438421994&headers=1`;
const productsUrl = `https://docs.google.com/spreadsheets/d/1FiOCY_GIkpCCZVaZplXQtQzwLORYQOws/gviz/tq?tqx=out:json&gid=664120326#gid=664120326&headers=1`;

let data = [];

let showProducts = 0;
const productsPerLoad = 20;

function getValue(data, index, column, fallback) {
    if (data[index].c[column]) {
        return data[index].c[column].v;
    }
    return fallback;
}

function createProductData(data, index) {
    const product = {
            id: getValue(data, index, 0, ''),
            name: getValue(data, index, 1, 'desconocido'),
            brand: getValue(data, index, 2, 'desconocido'),
            price: getValue(data, index, 3, 'desconocido'),
            sale: getValue(data, index, 4, ''),
            size: getValue(data, index, 5, 'desconocido'),
            badge: getValue(data, index, 6, ''),
            categories: getValue(data, index, 8, ''),
            active: getValue(data, index, 9, 'No'),
            image: getValue(data, index, 10, ''),
            description: getValue(data, index, 11, '')
        };
    return product;
}

function createStars(count) {
    let stars = '';
    for (let index = 0; index < count; index++) {
        stars += '<span>★</span>';
    }
    return stars;
}

function openMobileMenu() {
    document.getElementById('mobileMenu').classList.add('active');
    document.getElementById('mobileOverlay').classList.add('active');
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('active');
    document.getElementById('mobileOverlay').classList.remove('active');
}

const menuButton = document.getElementById('menuButton');
if (menuButton) {
    document.getElementById('menuButton').addEventListener('click', openMobileMenu);
    document.getElementById('menuClose').addEventListener('click', closeMobileMenu);
    document.getElementById('mobileOverlay').addEventListener('click', closeMobileMenu);
}

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

const cartButton = document.getElementById('cartButton');
if (cartButton) {
    cartButton.addEventListener('click', openBasket);
    document.getElementById('cartPanelClose').addEventListener('click', closeBasket);
    document.getElementById('cartOverlay').addEventListener('click', closeBasket);
}