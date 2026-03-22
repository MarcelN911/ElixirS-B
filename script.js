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


// 1) Die URL zu deinem Google Sheet (als JSON-API)
const SHEET_ID = '1FiOCY_GIkpCCZVaZplXQtQzwLORYQOws';
const dbUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

let allActiveProducts = [];
let shownProducts = 0;
const PRODUCTS_PER_LOAD = 20;
let isLoading = false;

// Wie lange die gespeicherten Daten gültig sind
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Daten vom Google Sheet laden (oder aus dem Speicher holen)
async function fetchProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) {
        return;
    }

    const cached = loadFromCache();

    if (cached) {
        console.log('Daten aus dem Cache geladen');
        allActiveProducts = cached;
    } else {
        console.log('Daten vom Google Sheet geladen');
        const response = await fetch(dbUrl);
        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        const rows = json.table.rows;
        allActiveProducts = filterActiveProducts(rows);
        saveToCache(allActiveProducts);
    }

    // Loader entfernen und erste 20 Produkte anzeigen
    container.innerHTML = '';
    loadMoreProducts();
    startScrollObserver();
}

// Produkte im Browser speichern
function saveToCache(products) {
    const cacheData = {
        products: products,
        timestamp: Date.now()
    };
    const jsonString = JSON.stringify(cacheData);
    console.log('Cache Größe:', Math.round(jsonString.length / 1024), 'KB');
    localStorage.setItem('elixir_products', jsonString);
    console.log('Cache gespeichert:', localStorage.getItem('elixir_products') !== null);
}

// Produkte aus dem Browser-Speicher laden
function loadFromCache() {
    const saved = localStorage.getItem('elixir_products');
    if (!saved) {
        return null;
    }

    const cacheData = JSON.parse(saved);
    const age = Date.now() - cacheData.timestamp;

    // Wenn die Daten älter als 24 Stunden sind, nicht verwenden
    if (age > CACHE_DURATION) {
        localStorage.removeItem('elixir_products');
        return null;
    }

    return cacheData.products;
}

// Nur Produkte mit "Si" behalten
function filterActiveProducts(rows) {
    const activeProducts = [];
    for (let i = 0; i < rows.length; i++) {
        const data = rows[i].c;
        if (data[9].v === 'Si') {
            const product = createProductData(data);
            activeProducts.push(product);
        }
    }
    return activeProducts;
}

// Produkt-Daten aus einer Zeile auslesen
function createProductData(data) {
    const product = {
        name: data[1].v,
        brand: data[2].v,
        price: data[3].v,
        sale: '',
        image: '',
        badge: '',
        gender: data[8].v,
    };
    if (data[4]) {
        product.sale = data[4].v;
    }
    if (data[5]) {
        product.image = data[5].v;
    }
    if (data[7]) {
        product.badge = data[7].v;
    }
    return product;
}

// Die nächsten 20 Produkte anzeigen
function loadMoreProducts() {
    isLoading = true;
    const end = Math.min(shownProducts + PRODUCTS_PER_LOAD, allActiveProducts.length);

    for (let i = shownProducts; i < end; i++) {
        createProductCard(allActiveProducts[i]);
    }
    shownProducts = end;

    // Neue Karten animieren
    animateCards();

    // Loader am Ende hinzufügen (wenn es noch mehr Produkte gibt)
    updateLoader();
    isLoading = false;
}

// Loader anzeigen oder entfernen
function updateLoader() {
    const container = document.getElementById('productsGrid');
    const oldLoader = document.getElementById('scrollLoader');
    if (oldLoader) {
        oldLoader.remove();
    }

    // Nur Loader anzeigen, wenn es noch mehr Produkte gibt
    if (shownProducts < allActiveProducts.length) {
        const loader = document.createElement('div');
        loader.id = 'scrollLoader';
        loader.className = 'loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <p class="loader-text">Más productos...</p>
        `;
        container.appendChild(loader);
    }
}

// Beobachtet den Loader — wenn man dorthin scrollt, werden mehr Produkte geladen
function startScrollObserver() {
    const observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting && !isLoading) {
            if (shownProducts < allActiveProducts.length) {
                loadMoreProducts();
            }
        }
    });

    // Alle 500ms prüfen ob ein neuer Loader da ist und ihn beobachten
    setInterval(function() {
        const loader = document.getElementById('scrollLoader');
        if (loader) {
            observer.observe(loader);
        }
    }, 500);
}

// Scroll-Animation für die Karten
function animateCards() {
    const cards = document.querySelectorAll('.fade-hidden');
    const observer = new IntersectionObserver(function(entries) {
        for (let i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
                entries[i].target.classList.add('fade-visible');
                observer.unobserve(entries[i].target);
            }
        }
    });
    for (let i = 0; i < cards.length; i++) {
        observer.observe(cards[i]);
    }
}

fetchProducts();