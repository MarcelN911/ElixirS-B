const searchForm = document.getElementById('searchForm');
if (searchForm) {
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        searchProductsMain();
    });
}

function searchProductsMain() {
    const searchInputMain = document.getElementById('searchInputMain').value.toLowerCase();
    if (searchInputMain.length < 3) {
        showSearchHint('Ingresa al menos 3 letras para buscar');
        return;
    }
    location.replace("productos.html?search=" + encodeURIComponent(searchInputMain));
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

async function fetchBestsellers() {
    const db = await fetch(dbUrl);
    const content = await db.text();

    json = JSON.parse(content.substring(47).slice(0, -2));
    data = json.table.rows;
    for (let index = 0; index < data.length; index++) {
        if (data[index].c[7] && data[index].c[7].v === 'Favorito') {
            const product = createProductData(data, index);
            createBestsellerTemplate(product);
        }
    }
}

fetchBestsellers();