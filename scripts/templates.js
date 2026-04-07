const badgeClasses = {
    'Nuevo': 'product-card-badge--new',
    'Sale': 'product-card-badge--sale',
    'Favorito': 'product-card-badge'
};

function createProductTemplate(product) {
    const container = document.getElementById('productsGrid');
    container.innerHTML += `<a href="producto.html?id=${product.id}" class="product-link">
                                <article class="product-card fade-hidden">
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
                                        ${createPrice(product.price, product.sale)}
                                    </div>
                                </article>
                            </a>`;
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
    return '<img src="./assets/img/product-placeholder.svg" loading="lazy" alt="Imagen del producto">';
}


function formatPrice(value) {
    if (typeof value === 'string') {
        return value + '.000 COP';
    }
    return value;
}

function getLowestPrice(priceStr) {
    const prices = priceStr.toString().split(',').map(p => parseInt(p.trim()));
    return Math.min(...prices).toString();
}

function createSizePills(size) {
    if (!size) return '';
    const sizes = size.toString().split(',');
    const pills = sizes.map(s => `<span class="size-pill">${s.trim()} ml</span>`).join('');
    return `<div class="product-card-sizes">${pills}</div>`;
}

function createPrice(price) {
    const prices = price.toString().split(',');
    const lowestPrice = getLowestPrice(price);
    const prefix = prices.length > 1 ? 'Desde ' : '';

    return `<div class="product-card-price">
                <span class="price-current">${prefix}$${formatPrice(lowestPrice)}</span>
            </div>`;
}

function createReviewTemplate(review) {
    const container = document.getElementById('testimonialsCarousel');
    container.innerHTML += `<article class="testimonial-card">
                                <div class="testimonial-rating">${createStars(review.stars)}</div>
                                <p class="testimonial-text">"${review.text}"</p>
                                <div class="testimonial-author">
                                    <div class="testimonial-avatar">${review.name.charAt(0)}</div>
                                    <div class="testimonial-info">
                                        <span class="testimonial-name">${review.name}</span>
                                        ${review.city ? `<span class="testimonial-location">${review.city}</span>` : ''}
                                    </div>
                                </div>
                            </article>`
                        ;
}

function createBestsellerTemplate(product) {
    const container = document.getElementById('bestsellersCarousel');
    container.innerHTML += `
                <a href="producto.html?id=${product.id}" class="product-link">
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
                            ${createPrice(product.price, product.sale)}
                        </div>
                    </article>
                </a>
    `;
}