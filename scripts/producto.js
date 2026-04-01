// ============================================
// PRODUCTO.JS — Elixir S&B
// Single product detail page:
// fetch product by ID, render all sections
// (info, image, sizes, description, related),
// quantity stepper, and add to cart
// ============================================

// Stores the current product's key data after it is fetched.
// Used later when the customer clicks "Agregar al carrito".
let pdCurrentProduct = null;

// ── Fetch & Render ────────────────────────────

/**
 * Main entry point for this page.
 * Loads all products, finds the one matching the URL's ?id= parameter,
 * then renders the full product detail page.
 * Redirects to 404 if the product is not found or the request fails.
 */
async function fetchProduct() {
    try {
        const allData = await loadAllProductRows();
        const product = findProductById(allData);
        if (!product) {
            window.location.replace('404.html');
            return;
        }
        pdCurrentProduct = buildCurrentProductMeta(product);
        renderFullProductPage(product, allData);
    } catch (e) {
        window.location.replace('404.html');
    }
}

fetchProduct();

/** Fetches the spreadsheet and returns the raw rows array. */
async function loadAllProductRows() {
    const db      = await fetch(productsUrl);
    const content = await db.text();
    const json    = JSON.parse(content.substring(47).slice(0, -2));
    return json.table.rows;
}

/** Reads the ?id= URL parameter and finds the matching product row. */
function findProductById(allData) {
    const id = new URLSearchParams(window.location.search).get('id');
    return allData.find(function(row) { return row.c[0].v == id; });
}

/** Extracts the minimal product fields needed for the add-to-cart function. */
function buildCurrentProductMeta(product) {
    let name;
    if (product.c[1]) {
        name = product.c[1].v;
    } else {
        name = 'Producto';
    }
    let brand;
    if (product.c[2]) {
        brand = product.c[2].v;
    } else {
        brand = '';
    }
    let image;
    if (product.c[10]) {
        image = product.c[10].v;
    } else {
        image = './img/product-placeholder.svg';
    }
    return {
        id:    product.c[0].v,
        name:  name,
        brand: brand,
        image: image
    };
}

/**
 * Calls all render functions in order, then shows the layout.
 * The layout is hidden by default and becomes visible after all data is ready.
 */
function renderFullProductPage(product, allData) {
    renderInfo(product);
    renderImage(product);
    renderDescription(product);
    renderSizes(product);
    renderRelated(allData, product);
    setupProductPage();
    document.querySelector('.pd-layout').classList.add('visible');
}

// ── Render Functions ──────────────────────────

/** Fills in the product name, brand, category eyebrow, and breadcrumb. */
function renderInfo(product) {
    let name;
    if (product.c[1]) {
        name = product.c[1].v;
    } else {
        name = 'Producto Desconocido';
    }
    let category;
    if (product.c[8]) {
        category = 'Perfume para ' + product.c[8].v;
    } else {
        category = 'Categoría desconocida';
    }
    let brand;
    if (product.c[2]) {
        brand = product.c[2].v;
    } else {
        brand = 'Desconocido';
    }
    document.querySelector('.pd-eyebrow').textContent            = category;
    document.querySelector('.pd-title').textContent              = name;
    document.querySelector('.pd-breadcrumb-current').textContent = name;
    document.querySelector('.pd-inspiration em').textContent     = brand;
}

/** Sets the main product image. Falls back to a placeholder if no image exists. */
function renderImage(product) {
    const imgEl = document.querySelector('.pd-image');
    if (product.c[10]) {
        imgEl.src = product.c[10].v;
    } else {
        imgEl.src = './img/product-placeholder.svg';
    }
}

/** Fills in the product description text. */
function renderDescription(product) {
    const descEl = document.querySelector('#pdDescription p');
    if (product.c[11]) {
        descEl.textContent = product.c[11].v;
    } else {
        descEl.textContent = 'No hay descripción disponible.';
    }
}

/**
 * Renders clickable size buttons for each available ml option.
 * Each button stores its price and sale price as data attributes.
 * Clicking a button updates the displayed price.
 */
function renderSizes(product) {
    const sizes      = parseSizeList(product.c[5]);
    const prices     = product.c[3] ? product.c[3].v.toString().split(',') : [];
    const salePrices = product.c[4] ? product.c[4].v.toString().split(',') : [];
    const container  = document.querySelector('.pd-sizes');
    container.innerHTML = '';

    if (sizes.length === 0) {
        container.innerHTML = '<p class="pd-no-sizes">Talla no disponible</p>';
        document.querySelector('.pd-size-selected').textContent = '';
        renderPrice('', '');
        return;
    }

    sizes.forEach(function(size, i) {
        container.appendChild(createSizeButton(size, prices[i], salePrices[i], i === 0));
    });

    const firstPrice    = prices[0]     ? prices[0].trim()     : '';
    const firstSalePrice = salePrices[0] ? salePrices[0].trim() : '';
    renderPrice(firstPrice, firstSalePrice);
    document.querySelector('.pd-size-selected').textContent = sizes[0] + ' ml';
    setupSizeClickListeners(container);
}

/**
 * Parses a comma-separated size string from the spreadsheet into an array.
 * Example: "50, 100, 200" → ['50', '100', '200']
 * Returns an empty array if the cell is missing.
 */
function parseSizeList(cell) {
    if (!cell) {
        return [];
    }
    return cell.v.toString().split(',').map(function(s) { return s.trim(); }).filter(Boolean);
}

/** Creates a single size button with its price data stored as attributes. */
function createSizeButton(size, price, salePrice, isFirst) {
    const btn = document.createElement('button');
    if (isFirst) {
        btn.className = 'pd-size-btn active';
    } else {
        btn.className = 'pd-size-btn';
    }
    btn.textContent       = size + ' ml';
    btn.dataset.price     = price     ? price.trim()     : '';
    btn.dataset.priceSale = salePrice ? salePrice.trim() : '';
    return btn;
}

/** Adds click listeners to size buttons so selecting one updates the price. */
function setupSizeClickListeners(container) {
    container.querySelectorAll('.pd-size-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            container.querySelectorAll('.pd-size-btn').forEach(function(b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');
            renderPrice(btn.dataset.price, btn.dataset.priceSale);
            document.querySelector('.pd-size-selected').textContent = 'Tamaño: ' + btn.textContent;
        });
    });
}

/**
 * Updates the price display area.
 * If a sale price exists, it shows the sale price and strikes through the original.
 */
function renderPrice(price, priceSale) {
    const priceEl = document.querySelector('#pdPrice');
    const oldEl   = document.querySelector('#pdPriceOld');
    if (!price) {
        priceEl.textContent = 'Precio no disponible';
        oldEl.textContent   = '';
        return;
    }
    if (priceSale) {
        priceEl.textContent = formatPrice(priceSale);
        oldEl.textContent   = formatPrice(price);
    } else {
        priceEl.textContent = formatPrice(price);
        oldEl.textContent   = '';
    }
}

// ── Related Products ──────────────────────────

/**
 * Renders a horizontally scrollable carousel of related products.
 * Prioritizes bestsellers, then fills with random same-category products.
 * Maximum 8 items are shown.
 */
function renderRelated(allData, currentProduct) {
    const candidates = getRelatedCandidates(allData, currentProduct);
    const sorted     = sortAndLimitRelated(candidates);
    const carousel   = document.getElementById('pdRelatedCarousel');
    sorted.forEach(function(row) {
        const product = createProductData(allData, allData.indexOf(row));
        carousel.innerHTML += buildRelatedCardHtml(product);
    });
    setupRelatedNav(carousel);
}

/**
 * Filters all products to find active ones in the same category,
 * excluding the product currently being viewed.
 */
function getRelatedCandidates(allData, currentProduct) {
    const currentId = String(currentProduct.c[0].v);
    let currentCategory;
    if (currentProduct.c[8]) {
        currentCategory = currentProduct.c[8].v;
    } else {
        currentCategory = '';
    }
    return allData.filter(function(row) {
        if (!row.c[9] || row.c[9].v === 'No') {
            return false;
        }
        if (String(row.c[0].v) === currentId) {
            return false;
        }
        if (!row.c[8] || row.c[8].v !== currentCategory) {
            return false;
        }
        return true;
    });
}

/**
 * Puts bestsellers first, shuffles other products randomly, then cuts to 8.
 * This ensures the most relevant products appear at the start of the carousel.
 */
function sortAndLimitRelated(candidates) {
    const bestsellers = candidates.filter(function(row) {
        return row.c[7] && row.c[7].v === 'Si';
    });
    const others = candidates.filter(function(row) {
        return !row.c[7] || row.c[7].v !== 'Si';
    });
    return [...bestsellers, ...others.sort(function() { return Math.random() - 0.5; })].slice(0, 8);
}

/** Returns the HTML string for a single related product card link. */
function buildRelatedCardHtml(product) {
    return `<a href="producto.html?id=${product.id}" class="product-link">
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
}

/** Wires up the left/right scroll buttons for the related products carousel. */
function setupRelatedNav(carousel) {
    function getScrollAmount() {
        const card = carousel.querySelector('.product-card');
        if (card) {
            return card.offsetWidth + 15;
        }
        return 300;
    }
    document.getElementById('pdRelatedLeft').addEventListener('click', function() {
        carousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    });
    document.getElementById('pdRelatedRight').addEventListener('click', function() {
        carousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    });
}

// ── Product Page Setup ────────────────────────

/** Wires up the quantity stepper (+/−) and the "Agregar al carrito" button. */
function setupProductPage() {
    document.getElementById('pdQtyMinus').addEventListener('click', function() {
        adjustQuantity(-1);
    });
    document.getElementById('pdQtyPlus').addEventListener('click', function() {
        adjustQuantity(1);
    });
    document.getElementById('pdAddCart').addEventListener('click', handleAddToCart);
}

/**
 * Increments or decrements the quantity display by `change`.
 * The minimum allowed quantity is 1.
 */
function adjustQuantity(change) {
    const el  = document.getElementById('pdQtyValue');
    const val = parseInt(el.textContent, 10);
    if (val + change >= 1) {
        el.textContent = val + change;
    }
}

// ── Add to Cart ───────────────────────────────

/**
 * Reads the active size button and returns its price data.
 * Returns null if no size button is selected.
 */
function readSelectedSizeData() {
    const btn = document.querySelector('.pd-size-btn.active');
    if (!btn) {
        return null;
    }
    const saleRaw = btn.dataset.priceSale;
    let salePrice;
    if (saleRaw && parseInt(saleRaw, 10) > 0) {
        salePrice = parseInt(saleRaw, 10);
    } else {
        salePrice = null;
    }
    return {
        size:         btn.textContent.replace(' ml', '').trim(),
        regularPrice: parseInt(btn.dataset.price, 10),
        salePrice:    salePrice
    };
}

/**
 * Reads the selected size and quantity, then adds the product to the cart.
 * Resets the quantity input back to 1 after adding.
 */
function handleAddToCart() {
    if (!pdCurrentProduct) {
        return;
    }
    const sizeData = readSelectedSizeData();
    if (!sizeData) {
        return;
    }
    const qty = parseInt(document.getElementById('pdQtyValue').textContent, 10) || 1;
    addToCart({
        sku:          `${pdCurrentProduct.id}-${sizeData.size}`,
        productId:    pdCurrentProduct.id,
        name:         pdCurrentProduct.name,
        brand:        pdCurrentProduct.brand,
        size:         sizeData.size,
        image:        pdCurrentProduct.image,
        regularPrice: sizeData.regularPrice,
        salePrice:    sizeData.salePrice,
        quantity:     qty
    });
    document.getElementById('pdQtyValue').textContent = '1';
}
