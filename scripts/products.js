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
