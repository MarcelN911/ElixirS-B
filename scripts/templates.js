
function createProductTemplate(product) {
    const container = document.getElementById('productsGrid');
    container.innerHTML += ` <article class="product-card">
                                <div class="product-card-image">
                                    ${createImg(product.image)}                                    
                                    <div class="product-card-overlay"></div>
                                    <button class="product-card-favorite" aria-label="Añadir a favoritos">
                                        <img src="./img/heart.svg" alt="Favorito">
                                    </button>
                                    ${createBadge(product.badge)}
                                </div>
                                <div class="product-card-info">
                                    <h3 class="product-card-name">${product.name}</h3>
                                    <p class="product-card-brand">Inspirado en ${product.brand}</p>
                                    <p class="product-card-gender">${product.categories}</p>
                                    ${createPrice(product.price, product.sale)}
                                    <button class="product-card-button">Añadir al Carrito</button>
                                </div>
                            </article>`;
}

function createBadge(badge) {
    if (badge) {
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

function createPrice(price, sale) {
    if (sale) {
        return `<div class="product-card-price">
                    <span class="price-old">${sale}.000 COP</span>
                    <span class="price-current">${price}.000 COP</span>
                </div>`;
    }
    return `<div class="product-card-price">
                <span class="price-current">${price}.000 COP</span>
            </div>`;
}