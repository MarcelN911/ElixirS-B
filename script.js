startIntro();

const dbUrl = `https://docs.google.com/spreadsheets/d/1FiOCY_GIkpCCZVaZplXQtQzwLORYQOws/gviz/tq?tqx=out:json`;

let data = [];

let showProducts = 0;
const productsPerLoad = 20;

async function fetchProducts() {
    const db = await fetch(dbUrl);
    const content = await db.text();

    json = JSON.parse(content.substring(47).slice(0, -2));
    data = json.table.rows;
    createProductCards(data);

    const params = new URLSearchParams(window.location.search);
    const searchValue = params.get('search');
    if (searchValue) {
        document.getElementById('searchInput').value = searchValue;
        searchProducts();
        searchClear.classList.add('visible');
    }
    
}
fetchProducts();

function createProductCards(data) {
    for (let index = showProducts; index < showProducts + productsPerLoad && index < data.length; index++) {
        const product = createProductData(data, index);
        createProductTemplate(product);
    } showProducts = showProducts + productsPerLoad;
        startScrollObserver();
        animateCards();
}

function createProductData(data, index) {
    const product = {
            name: data[index].c[1].v,
            brand: data[index].c[2].v,
            price: data[index].c[3].v,
            sale: ifSale(data, index),
            image: ifImage(data, index),
            description: data[index].c[6].v,
            badge: ifBadge(data, index),
            categories: data[index].c[8].v,
            active: data[index].c[9].v
        };
    return product;
}


function ifSale(data, index) {
    if (data[index].c[4]) {
        return data[index].c[4].v;
    }
    return '';
}

function ifImage(data, index) {
    if (data[index].c[5]) {
        return data[index].c[5].v;
    }
    return '';
}

function ifBadge(data, index) {
    if (data[index].c[7]) {
        return data[index].c[7].v;
    }
    return '';
}

function removeOldLoader() {
    const oldLoader = document.getElementById('scrollLoader');
    if (oldLoader) {
        oldLoader.remove();
    }
}

function createLoader() {
    const container = document.getElementById('productsGrid');
    const loader = document.createElement('div');
    loader.id = 'scrollLoader';
    loader.className = 'loader';
    loader.innerHTML = `
        <div class="loader-spinner"></div>
        <p class="loader-text">Más productos...</p>
    `;
    container.appendChild(loader);
    return loader;
}

function onLoaderVisible(observer, loader) {
    observer.unobserve(loader);
    loader.remove();
    createProductCards(data);
    startScrollObserver();
}

function startScrollObserver() {
    removeOldLoader();

    if (showProducts >= data.length) {
        return;
    }

    const loader = createLoader();
    const observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) {
            onLoaderVisible(observer, loader);
        }
    });
    observer.observe(loader);
}

function animateCards() {
    const cards = document.querySelectorAll('.fade-hidden');
    const observer = new IntersectionObserver(function(entries) {
        for (let index = 0; index < entries.length; index++) {
            if (entries[index].isIntersecting) {
                entries[index].target.classList.add('fade-visible');
                observer.unobserve(entries[index].target);
            }
        }
    });
    for (let index = 0; index < cards.length; index++) {
        observer.observe(cards[index]);
    }
}

function searchProductsMain() {
    const searchInputMain = document.getElementById('searchInputMain').value.toLowerCase();
    if (searchInputMain.length < 3) {
        showSearchHint('Ingresa al menos 3 letras para buscar');
        return;
    }
    location.replace("productos.html?search=" + encodeURIComponent(searchInputMain));
}

function filterProducts(category) {
    const container = document.getElementById('productsGrid');
    container.innerHTML = '';
    showProducts = 0;
    switchFilterTab(category);
    document.getElementById('searchInput').value = '';
    document.getElementById('searchClear').classList.remove('visible');

    if (category === 'Todos') {
        createProductCards(data);
    } else {
        for (let index = 0; index < data.length; index++) {
            if (data[index].c[8].v === category) {
                const product = createProductData(data, index);
                createProductTemplate(product);
            }
        }
    } animateCards();
}


function searchProducts() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    hideSearchHint();
    switchFilterTab('Todos');

    if (searchInput === '') {
        filterProducts('Todos');
        return;
    }
    if (searchInput.length < 3) {
        showSearchHint('Ingresa al menos 3 letras para buscar');
        return;
    }

    const container = document.getElementById('productsGrid');
    container.innerHTML = '';
    let resultsFound = 0;

    for (let index = 0; index < data.length; index++) {
        const productName = data[index].c[1].v.toLowerCase();
        const brandName = data[index].c[2].v.toLowerCase();
        if (productName.includes(searchInput) || brandName.includes(searchInput)) {
            const product = createProductData(data, index);
            createProductTemplate(product);
            resultsFound = resultsFound + 1;
        }
    }

    if (resultsFound === 0) {
        showNoResults(searchInput);
    }
    animateCards();
}

function showSearchHint(message) {
    hideSearchHint();
    const form = document.getElementById('searchForm');
    const hint = document.createElement('p');
    hint.className = 'search-hint';
    hint.id = 'searchHint';
    hint.textContent = message;
    form.parentNode.appendChild(hint);
}

function hideSearchHint() {
    const hint = document.getElementById('searchHint');
    if (hint) {
        hint.remove();
    }
}

function showNoResults(searchInput) {
    const container = document.getElementById('productsGrid');
    container.innerHTML = `
        <div class="no-results">
            <p class="no-results-title">No encontramos "${searchInput}"</p>
            <p class="no-results-text">Intenta con otro nombre o marca</p>
        </div>
    `;
}   

const searchForm = document.getElementById('searchForm');
if (searchForm) {
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        searchProducts();
    });
}

const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');

if (searchInput && searchClear) {
    searchInput.addEventListener('input', function() {
        if (searchInput.value.length > 0) {
            searchClear.classList.add('visible');
        } else {
            searchClear.classList.remove('visible');
        }
    });

    searchClear.addEventListener('click', function() {
        searchInput.value = '';
        searchClear.classList.remove('visible');
        hideSearchHint();
        filterProducts('Todos');
    });
}


function switchFilterTab(category) {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        if (tab.textContent === category) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function startIntro() {
    const overlay = document.getElementById('introOverlay');
    if (!overlay) {
        return;
    }

    if (sessionStorage.getItem('introSeen')) {
        overlay.classList.add('hidden');
        return;
    }

    setTimeout(function() {
        overlay.classList.add('slide-up');
    }, 2000);

    setTimeout(function() {
        overlay.classList.add('fade-out');
    }, 2900);

    setTimeout(function() {
        overlay.classList.add('hidden');
        sessionStorage.setItem('introSeen', 'true');
    }, 3500);
}

