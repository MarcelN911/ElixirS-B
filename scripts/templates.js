
function createProductTemplate(product) {
    const container = document.getElementById('productsGrid');
    container.innerHTML += ` <article class="product-card fade-hidden">
                                <div class="product-card-image">
                                    ${createImg(product.image)}
                                    <div class="product-card-overlay"></div>
                                    ${createBadge(product.badge)}
                                    <span class="product-card-gender">${product.categories}</span>
                                </div>
                                <div class="product-card-info">
                                    <h3 class="product-card-name">${product.name}</h3>
                                    <p class="product-card-brand">${product.brand}</p>
                                    ${product.size ? `<p class="product-card-size">${formatSize(product.size)}</p>` : ''}
                                    ${createPrice(product.price, product.sale)}
                                </div>
                            </article>`;
}

function createBadge(badge) {
    if (badge && badge !== 'Normal') {
        return `<span class="product-card-badge">${badge}</span>`;
    }
        return '';
}

function createImg(image) {
    if (image) {
        return `<img src="${image}" loading="lazy" alt="Imagen del producto">`;
    }
    return '<img src="./img/product-placeholder.svg" loading="lazy" alt="Imagen del producto">';
}

function formatSize(value) {
    if (typeof value === 'number') {
        return value + ' ml';
    }
    return value;
}

function formatPrice(value) {
    if (typeof value === 'number') {
        return value + '.000 COP';
    }
    return value;
}

function createPrice(price, sale) {
    if (sale) {
        return `<div class="product-card-price">
                    <span class="price-old">${formatPrice(sale)}</span>
                    <span class="price-current">${formatPrice(price)}</span>
                </div>`;
    }
    return `<div class="product-card-price">
                <span class="price-current">${formatPrice(price)}</span>
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
        </article>`;
}

function createBestsellerTemplate(product) {
    const container = document.getElementById('bestsellersCarousel');
    container.innerHTML += `
                    <article class="product-card">
                        <div class="product-card-image">
                            ${createImg(product.image)}
                            <div class="product-card-overlay"></div>
                            <button class="product-card-favorite" aria-label="Añadir a favoritos">
                                <img src="./img/heart.svg" alt="Favorito">
                            </button>
                            ${createBadge(product.badge)}
                            <span class="product-card-gender">${product.categories}</span>
                        </div>
                        <div class="product-card-info">
                            <h3 class="product-card-name">${product.name}</h3>
                            <p class="product-card-brand">${product.brand}</p>
                            ${createPrice(product.price, product.sale)}
                        </div>
                    </article>
    `;
}