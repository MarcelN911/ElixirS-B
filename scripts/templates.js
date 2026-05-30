const badgeClasses = {
    'Nuevo':      'product-card-badge--new',
    'Más vendido': 'product-card-badge--bestseller',
    'Sale':       'product-card-badge--sale',
    'Favorito':   'product-card-badge'
};

function createWishBtn(id) {
    const active = isHearted(id) ? ' elixir-wish--active' : '';
    return `<button class="elixir-wish${active}" data-id="${id}" onclick="event.preventDefault();elixirToggleHeart(this)" aria-label="Guardar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    </button>`;
}

async function elixirToggleHeart(btn) {
    const id     = btn.dataset.id;
    const active = btn.classList.contains('elixir-wish--active');
    btn.classList.toggle('elixir-wish--active');
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', active ? 'none' : 'currentColor');
    if (!active) await heartProduct(id);
}

function createProductTemplate(product) {
    const container = document.getElementById('productsGrid');
    container.insertAdjacentHTML('beforeend', `<a href="producto.html?id=${product.id}" class="product-link">
                                <article class="product-card fade-hidden">
                                    <div class="product-card-image">
                                        ${createImg(product.image)}
                                        <div class="product-card-overlay"></div>
                                        ${createBadge(product.badge)}
                                        ${createWishBtn(product.id)}
                                        <span class="product-card-gender">${product.categories}</span>
                                    </div>
                                    <div class="product-card-info">
                                        <div class="product-card-name-wrap"><h3 class="product-card-name">${product.name}</h3></div>
                                        <p class="product-card-brand">${product.brand}</p>
                                        ${createSizePills(product.size)}
                                        ${createPrice(product.price, product.sale, product.multiPrice)}
                                    </div>
                                </article>
                            </a>`);
}

function createBadge(badge) {
    if (badge && badge !== 'Normal') {
        return `<span class="product-card-badge ${badgeClasses[badge]}">${badge}</span>`;
    }
        return '';
}

function createImg(image) {
    if (image) {
        return `<img src="${image}" loading="lazy" alt="Imagen del producto">`;
    }
    return '<img src="./assets/img/logo-transparent.png" loading="lazy" alt="Imagen del producto">';
}


function formatPrice(value) {
    if (!value && value !== 0) return '';
    return '$' + Number(value).toLocaleString('es-CO') + ' COP';
}

function createSizePills(size) {
    if (!size) return '';
    const sizes = size.toString().split(',');
    const pills = sizes.map(s => `<span class="size-pill">${s.trim()} ml</span>`).join('');
    return `<div class="product-card-sizes">${pills}</div>`;
}

function createPrice(price, sale, multiPrice) {
    if (!price) {
        return `<div class="product-card-price">
                    <span class="price-current">Precio no disponible</span>
                </div>`;
    }
    const desde = multiPrice ? '<span class="price-desde">desde</span>' : '';
    if (sale && sale > 0) {
        return `<div class="product-card-price">
                    <span class="price-old">${formatPrice(price)}</span>
                    <span class="price-row">${desde}<span class="price-current">${formatPrice(sale)}</span></span>
                </div>`;
    }
    return `<div class="product-card-price">
                <span class="price-row">${desde}<span class="price-current">${formatPrice(price)}</span></span>
            </div>`;
}

function createReviewTemplate(review) {
    const container = document.getElementById('testimonialsCarousel');
    container.insertAdjacentHTML('beforeend', `<article class="testimonial-card">
                                <div class="testimonial-rating">${createStars(review.stars)}</div>
                                <p class="testimonial-text">"${review.text}"</p>
                                <div class="testimonial-author">
                                    <div class="testimonial-avatar">${review.name.charAt(0)}</div>
                                    <div class="testimonial-info">
                                        <span class="testimonial-name">${review.name}</span>
                                        ${review.city ? `<span class="testimonial-location">${review.city}</span>` : ''}
                                    </div>
                                </div>
                            </article>`);
}

function createBestsellerTemplate(product) {
    const container = document.getElementById('bestsellersCarousel');
    container.insertAdjacentHTML('beforeend', `
                <a href="producto.html?id=${product.id}" class="product-link">
                    <article class="product-card">
                        <div class="product-card-image">
                            ${createImg(product.image)}
                            <div class="product-card-overlay"></div>
                            ${createBadge(product.badge)}
                            ${createWishBtn(product.id)}
                            <span class="product-card-gender">${product.categories}</span>
                        </div>
                        <div class="product-card-info">
                            <div class="product-card-name-wrap"><h3 class="product-card-name">${product.name}</h3></div>
                            <p class="product-card-brand">${product.brand}</p>
                            ${createPrice(product.price, product.sale, false)}
                        </div>
                    </article>
                </a>
    `);
}