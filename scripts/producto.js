/* ============================================
   PRODUCTO.JS — Product Detail Page Logic
   ============================================ */

let pdCurrentProduct = null;

// ──────────────────────────────────────────
// Fetch & Render Product
// ──────────────────────────────────────────

async function fetchProduct() {
    try {
    const db = await fetch(productsUrl);
    const content = await db.text();
    const json = JSON.parse(content.substring(47).slice(0, -2));
    const allData = json.table.rows;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const product = allData.find(row => row.c[0].v == id);

    if (!product) {
        window.location.replace('404.html');
        return;
    }

    pdCurrentProduct = {
        id:    product.c[0].v,
        name:  product.c[1] ? product.c[1].v : 'Producto',
        brand: product.c[2] ? product.c[2].v : '',
        image: product.c[10] ? product.c[10].v : './img/product-placeholder.svg'
    };

    renderInfo(product);
    renderImage(product);
    renderDescription(product);
    renderSizes(product);
    renderRelated(allData, product);
    setupProductPage();
    document.querySelector('.pd-layout').classList.add('visible');
    } catch (e) {
        window.location.replace('404.html');
    }
}

fetchProduct();

// ──────────────────────────────────────────
// Render Functions
// ──────────────────────────────────────────

function renderInfo(product) {
    document.querySelector('.pd-eyebrow').textContent =
        product.c[8] ? 'Perfume para ' + product.c[8].v : 'Categoría desconocida';
    document.querySelector('.pd-title').textContent =
        product.c[1] ? product.c[1].v : 'Producto Desconocido';
    document.querySelector('.pd-breadcrumb-current').textContent =
        product.c[1] ? product.c[1].v : 'Producto Desconocido';
    document.querySelector('.pd-inspiration em').textContent =
        product.c[2] ? product.c[2].v : 'Desconocido';
}

function renderImage(product) {
    document.querySelector('.pd-image').src =
        product.c[10] ? product.c[10].v : './img/product-placeholder.svg';
}

function renderSizes(product) {
    const sizes     = product.c[5] ? product.c[5].v.toString().split(',').map(s => s.trim()).filter(Boolean) : [];
    const price     = product.c[3] ? product.c[3].v.toString().split(',') : [];
    const priceSale = product.c[4] ? product.c[4].v.toString().split(',') : [];
    const sizeContainer = document.querySelector('.pd-sizes');
    sizeContainer.innerHTML = '';

    if (sizes.length === 0) {
        sizeContainer.innerHTML = '<p class="pd-no-sizes">Talla no disponible</p>';
        document.querySelector('.pd-size-selected').textContent = '';
        renderPrice('', '');
        return;
    }

    sizes.forEach((size, index) => {
        const sizeOption = document.createElement('button');
        sizeOption.classList.add('pd-size-btn');
        if (index === 0) sizeOption.classList.add('active');
        sizeOption.textContent = size.trim() + ' ml';
        sizeOption.dataset.price     = price[index] ? price[index].trim() : '';
        sizeOption.dataset.priceSale = priceSale[index] ? priceSale[index].trim() : '';
        sizeContainer.appendChild(sizeOption);
    });

    const firstPrice = price[0] ? price[0].trim() : '';
    const firstSale  = priceSale[0] ? priceSale[0].trim() : '';
    renderPrice(firstPrice, firstSale);
    document.querySelector('.pd-size-selected').textContent = sizes[0].trim() + ' ml';

    sizeContainer.querySelectorAll('.pd-size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sizeContainer.querySelectorAll('.pd-size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPrice(btn.dataset.price, btn.dataset.priceSale);
            document.querySelector('.pd-size-selected').textContent = 'Tamaño: ' + btn.textContent;
        });
    });
}

function renderDescription(product) {
    document.querySelector('#pdDescription p').textContent = product.c[11]
        ? product.c[11].v
        : 'No hay descripción disponible.';
}

function renderPrice(price, priceSale) {
    const priceEl = document.querySelector('#pdPrice');
    const oldEl   = document.querySelector('#pdPriceOld');
    if (!price) {
        priceEl.textContent = 'Precio no disponible';
        oldEl.textContent   = '';
        return;
    }
    priceEl.textContent = priceSale ? formatPrice(priceSale) : formatPrice(price);
    oldEl.textContent   = priceSale ? formatPrice(price) : '';
}

function renderRelated(allData, currentProduct) {
    const carousel = document.getElementById('pdRelatedCarousel');
    const currentId       = currentProduct.c[0].v;
    const currentCategory = currentProduct.c[8] ? currentProduct.c[8].v : '';

    const candidates = allData.filter(row => {
        if (!row.c[9] || row.c[9].v === 'No') return false;
        if (String(row.c[0].v) === String(currentId)) return false;
        if (!row.c[8] || row.c[8].v !== currentCategory) return false;
        return true;
    });

    const bestsellers    = candidates.filter(row =>  row.c[7] && row.c[7].v === 'Si');
    const others         = candidates.filter(row => !row.c[7] || row.c[7].v !== 'Si');
    const shuffled       = [...bestsellers, ...others.sort(() => Math.random() - 0.5)].slice(0, 8);

    shuffled.forEach(row => {
        const product = createProductData(allData, allData.indexOf(row));
        carousel.innerHTML += `<a href="producto.html?id=${product.id}" class="product-link">
            <article class="product-card">
                <div class="product-card-image">
                    ${createImg(product.image)}
                    <div class="product-card-overlay"></div>
                    ${createBadge(product.badge)}
                    <span class="product-card-gender">${product.categories}</span>
                </div>
                <div class="product-card-info">
                    <div class="product-card-name-wrap"><h3 class="product-card-name">${product.name}</h3></div>
                    <p class="product-card-brand">${product.brand}</p>
                    ${createSizePills(product.size)}
                    ${createPrice(product.price)}
                </div>
            </article>
        </a>`;
    });

    const btnLeft  = document.getElementById('pdRelatedLeft');
    const btnRight = document.getElementById('pdRelatedRight');
    btnLeft.addEventListener('click', () => {
        const card = carousel.querySelector('.product-card');
        carousel.scrollBy({ left: -(card.offsetWidth + 15), behavior: 'smooth' });
    });
    btnRight.addEventListener('click', () => {
        const card = carousel.querySelector('.product-card');
        carousel.scrollBy({ left: card.offsetWidth + 15, behavior: 'smooth' });
    });
}

// ──────────────────────────────────────────
// Product Page Setup (runs after fetch)
// ──────────────────────────────────────────

function setupProductPage() {
    // Quantity buttons
    document.getElementById('pdQtyMinus').addEventListener('click', function () {
        const val = parseInt(document.getElementById('pdQtyValue').textContent, 10);
        if (val > 1) document.getElementById('pdQtyValue').textContent = val - 1;
    });
    document.getElementById('pdQtyPlus').addEventListener('click', function () {
        const val = parseInt(document.getElementById('pdQtyValue').textContent, 10);
        document.getElementById('pdQtyValue').textContent = val + 1;
    });

    // Add to cart button
    document.getElementById('pdAddCart').addEventListener('click', handleAddToCart);
}

// ──────────────────────────────────────────
// Add to Cart
// ──────────────────────────────────────────

function handleAddToCart() {
    if (!pdCurrentProduct) return;
    const activeBtn = document.querySelector('.pd-size-btn.active');
    if (!activeBtn) return;

    const qty          = parseInt(document.getElementById('pdQtyValue').textContent, 10) || 1;
    const size         = activeBtn.textContent.replace(' ml', '').trim();
    const regularPrice = parseInt(activeBtn.dataset.price, 10);
    const salePriceRaw = activeBtn.dataset.priceSale;
    const salePrice    = salePriceRaw && parseInt(salePriceRaw, 10) > 0
        ? parseInt(salePriceRaw, 10)
        : null;

    addToCart({
        sku:          `${pdCurrentProduct.id}-${size}`,
        productId:    pdCurrentProduct.id,
        name:         pdCurrentProduct.name,
        brand:        pdCurrentProduct.brand,
        size,
        image:        pdCurrentProduct.image,
        regularPrice,
        salePrice,
        quantity:     qty
    });

    document.getElementById('pdQtyValue').textContent = '1';
}
