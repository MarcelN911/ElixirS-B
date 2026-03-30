/* ============================================
   CART.JS — Elixir S&B
   State · CRUD · Pricing · WhatsApp Checkout
   UI Rendering
   ============================================ */

const WHATSAPP_NUMBER     = '+573003150038';
const FREE_SHIPPING_THRESHOLD = 300000;      // COP
const CART_STORAGE_KEY    = 'elixir_cart'

let cart = [];

function loadCart() {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        cart = stored ? JSON.parse(stored) : [];
    } catch (e) {
        cart = [];
    }
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// ──────────────────────────────────────────
// Price Helpers
//
// Google Sheets stores prices as raw numbers  (65, 95, 160)
// representing 65.000, 95.000, 160.000 COP.
// ──────────────────────────────────────────

function rawToPrice(raw) {
    return parseInt(raw, 10) * 1000;
}

// 65000 → "65.000"
function formatCOP(amount) {
    return Math.round(amount)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// ──────────────────────────────────────────

function addToCart(item) {
    const existing = cart.find(c => c.sku === item.sku);
    if (existing) {
        existing.quantity += (item.quantity || 1);
        saveCart();
        const qtyEl = document.querySelector(`[data-sku="${item.sku}"] .cart-qty-value`);
        if (qtyEl) qtyEl.textContent = existing.quantity;
        updateTotalsOnly();
    } else {
        cart.push({ ...item, quantity: item.quantity || 1 });
        saveCart();
        const content = document.getElementById('cartPanelContent');
        if (content) {
            const emptyEl = content.querySelector('.cart-empty');
            if (emptyEl) {
                content.innerHTML = buildCartItemHtml(cart[cart.length - 1]);
            } else {
                content.insertAdjacentHTML('beforeend', buildCartItemHtml(cart[cart.length - 1]));
            }
        }
        updateTotalsOnly();
    }
    openBasket();
}

function removeFromCart(sku) {
    cart = cart.filter(item => item.sku !== sku);
    saveCart();
    const itemEl = document.querySelector(`[data-sku="${sku}"]`);
    if (itemEl) itemEl.remove();
    if (cart.length === 0) {
        const content = document.getElementById('cartPanelContent');
        if (content) content.innerHTML = `
            <div class="cart-empty">
                <img src="./img/shopping-car.svg" alt="Carrito vacío">
                <p>Tu carrito está vacío</p>
                <a href="productos.html" class="cart-empty-link">Ver productos</a>
            </div>`;
    }
    updateTotalsOnly();
}

function updateQuantity(sku, change) {
    const item = cart.find(c => c.sku === sku);
    if (!item) return;
    const newQty = item.quantity + change;
    if (newQty < 1) {
        removeFromCart(sku);
        return;
    }
    item.quantity = newQty;
    saveCart();
    const qtyEl = document.querySelector(`[data-sku="${sku}"] .cart-qty-value`);
    if (qtyEl) qtyEl.textContent = newQty;
    updateTotalsOnly();
}

// ──────────────────────────────────────────

function getSubtotal() {
    return cart.reduce(
        (sum, item) => sum + rawToPrice(item.regularPrice) * item.quantity,
        0
    );
}

function getTotalDiscount() {
    return cart.reduce((sum, item) => {
        if (!item.salePrice) return sum;
        return sum + (rawToPrice(item.regularPrice) - rawToPrice(item.salePrice)) * item.quantity;
    }, 0);
}

function getFinalTotal() {
    return getSubtotal() - getTotalDiscount();
}

function getShippingShortfall() {
    return Math.max(0, FREE_SHIPPING_THRESHOLD - getFinalTotal());
}

// ──────────────────────────────────────────

function getCartSummary() {
    const subtotal          = getSubtotal();
    const totalDiscount     = getTotalDiscount();
    const finalTotal        = getFinalTotal();
    const shippingShortfall = getShippingShortfall();
    return {
        itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
        subtotal,
        totalDiscount,
        finalTotal,
        shippingShortfall,
        hasFreeShipping: cart.length > 0 && shippingShortfall === 0
    };
}

// ──────────────────────────────────────────

function buildCartItemHtml(item) {
    const saleBadge = item.salePrice
        ? '<span class="cart-item-sale-tag">Oferta</span>'
        : '';

    const priceHtml = item.salePrice
        ? `<span class="cart-item-price">$${formatCOP(rawToPrice(item.salePrice))}</span>
           <span class="cart-item-price-old">$${formatCOP(rawToPrice(item.regularPrice))}</span>`
        : `<span class="cart-item-price">$${formatCOP(rawToPrice(item.regularPrice))}</span>`;

    return `
        <div class="cart-item" data-sku="${item.sku}">
            <div class="cart-item-image">
                <img src="${item.image || './img/product-placeholder.svg'}"
                     alt="${item.name}" loading="lazy">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-top">
                    <div class="cart-item-meta">
                        <p class="cart-item-name">${item.name} ${saleBadge}</p>
                        <p class="cart-item-variant">${item.size} ml · ${item.brand}</p>
                    </div>
                    <button class="cart-item-remove-x"
                            onclick="removeFromCart('${item.sku}')"
                            aria-label="Eliminar producto">×</button>
                </div>
                <div class="cart-item-bottom">
                    <div class="cart-item-qty">
                        <button class="cart-qty-btn"
                                onclick="updateQuantity('${item.sku}', -1)"
                                aria-label="Reducir cantidad">−</button>
                        <span class="cart-qty-value">${item.quantity}</span>
                        <button class="cart-qty-btn"
                                onclick="updateQuantity('${item.sku}', 1)"
                                aria-label="Aumentar cantidad">+</button>
                    </div>
                    <div class="cart-item-price-wrap">
                        ${priceHtml}
                        <span class="cart-item-cop">COP</span>
                    </div>
                </div>
            </div>
        </div>`;
}

function renderCartItems() {
    const content = document.getElementById('cartPanelContent');
    if (!content) return;

    if (cart.length === 0) {
        content.innerHTML = `
            <div class="cart-empty">
                <img src="./img/shopping-car.svg" alt="Carrito vacío">
                <p>Tu carrito está vacío</p>
                <a href="productos.html" class="cart-empty-link">Ver productos</a>
            </div>`;
        return;
    }

    content.innerHTML = cart.map(buildCartItemHtml).join('');
}

// ──────────────────────────────────────────

function updateCartCounts() {
    const summary = getCartSummary();
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = summary.itemCount;
    });
    const barCount = document.getElementById('cartBarCount');
    if (barCount) barCount.textContent = summary.itemCount;
}

function updateCartBar() {
    const summary = getCartSummary();
    const cartBar = document.getElementById('cartBar');
    if (!cartBar) return;

    cartBar.classList.toggle('active', summary.itemCount > 0);

    const itemsText = document.getElementById('cartItemsText');
    if (itemsText) {
        itemsText.textContent = summary.itemCount === 1
            ? '1 artículo'
            : `${summary.itemCount} artículos`;
    }
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = formatCOP(summary.finalTotal);
}

// ──────────────────────────────────────────

function renderCartSummary() {
    const summary = getCartSummary();

    const subtotalEl = document.getElementById('cartSubtotal');
    if (subtotalEl) subtotalEl.textContent = `$${formatCOP(summary.subtotal)} COP`;

    const discountRow = document.getElementById('cartDiscountRow');
    const discountEl  = document.getElementById('cartDiscount');
    if (discountRow && discountEl) {
        discountRow.style.display = summary.totalDiscount > 0 ? 'flex' : 'none';
        discountEl.textContent    = `−$${formatCOP(summary.totalDiscount)} COP`;
    }

    const totalEl = document.getElementById('cartFinalTotal');
    if (totalEl) totalEl.textContent = `$${formatCOP(summary.finalTotal)} COP`;

    // Shipping progress bar
    const progressEl   = document.getElementById('cartShippingProgress');
    const shippingText = document.getElementById('cartShippingText');
    if (progressEl && shippingText) {
        const pct = cart.length === 0
            ? 0
            : Math.min(100, (summary.finalTotal / FREE_SHIPPING_THRESHOLD) * 100);
        progressEl.style.width = `${pct}%`;

        if (summary.hasFreeShipping) {
            shippingText.textContent = '¡Envío gratis incluido! 🎉';
            shippingText.classList.add('is-free');
        } else {
            shippingText.textContent =
                `Te faltan $${formatCOP(summary.shippingShortfall)} COP para envío gratis`;
            shippingText.classList.remove('is-free');
        }
    }

    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    if (checkoutBtn) checkoutBtn.disabled = summary.itemCount === 0;
}

// ──────────────────────────────────────────

function updateTotalsOnly() {
    renderCartSummary();
    updateCartCounts();
    updateCartBar();
}

function updateCartUI() {
    renderCartItems();
    renderCartSummary();
    updateCartCounts();
    updateCartBar();
}

// ────────────── Checkout Modal ──────────────

function openCheckoutModal() {
    if (cart.length === 0) return;
    const modal = document.getElementById('checkoutModal');
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const nameInput = document.getElementById('checkoutName');
    if (nameInput) nameInput.focus();
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    const errorEl = document.getElementById('checkoutError');
    if (errorEl) errorEl.textContent = '';
}

function validateCheckoutForm() {
    const name       = document.getElementById('checkoutName').value.trim();
    const celular    = document.getElementById('checkoutCelular').value.trim();
    const ciudad     = document.getElementById('checkoutCiudad').value.trim();
    const barrio     = document.getElementById('checkoutBarrio').value.trim();
    const direccion  = document.getElementById('checkoutDireccion').value.trim();
    const referencia = document.getElementById('checkoutReferencia').value.trim();
    const errorEl    = document.getElementById('checkoutError');

    if (!name) {
        errorEl.textContent = 'Por favor ingresa tu nombre completo.';
        document.getElementById('checkoutName').focus();
        return null;
    }
    if (!celular) {
        errorEl.textContent = 'Por favor ingresa tu número de celular.';
        document.getElementById('checkoutCelular').focus();
        return null;
    }
    if (!ciudad) {
        errorEl.textContent = 'Por favor ingresa tu ciudad.';
        document.getElementById('checkoutCiudad').focus();
        return null;
    }
    if (!barrio) {
        errorEl.textContent = 'Por favor ingresa tu barrio o sector.';
        document.getElementById('checkoutBarrio').focus();
        return null;
    }
    if (!direccion) {
        errorEl.textContent = 'Por favor ingresa tu dirección.';
        document.getElementById('checkoutDireccion').focus();
        return null;
    }
    errorEl.textContent = '';
    return { name, celular, ciudad, barrio, direccion, referencia };
}

function generateWhatsAppMessage(customerData) {
    const summary = getCartSummary();

    const itemLines = cart.map(item => {
        const qtyLabel = item.quantity > 1 ? ` × ${item.quantity}` : '';
        if (item.salePrice) {
            const total = rawToPrice(item.salePrice) * item.quantity;
            return `• ${item.name} (${item.size} ml)${qtyLabel} — *$${formatCOP(total)} COP* ¡Oferta! _(antes $${formatCOP(rawToPrice(item.regularPrice))} c/u)_`;
        }
        const total = rawToPrice(item.regularPrice) * item.quantity;
        return `• ${item.name} (${item.size} ml)${qtyLabel} — $${formatCOP(total)} COP`;
    }).join('\n');

    const discountLine = summary.totalDiscount > 0
        ? `\n🏷️ Descuento: −$${formatCOP(summary.totalDiscount)} COP`
        : '';

    const shippingLine = summary.hasFreeShipping
        ? '\n🚚 Envío: *¡GRATIS!* 🎉'
        : '\n🚚 Envío: A calcular';

    const savingsLine = summary.totalDiscount > 0
        ? `\n💛 *Ahorro total: $${formatCOP(summary.totalDiscount)} COP*`
        : '';

    const referenciaLine = customerData.referencia
        ? `\nReferencia: ${customerData.referencia}`
        : '';

    return (
`*NUEVO PEDIDO — Elixir S&B*

👤 *Cliente:* ${customerData.name}
📱 *Celular:* ${customerData.celular}
📍 *Dirección:* ${customerData.direccion}, ${customerData.barrio}, ${customerData.ciudad}${referenciaLine}

*Productos:*
${itemLines}

*Resumen del pedido:*
Subtotal: $${formatCOP(summary.subtotal)} COP${discountLine}${shippingLine}${savingsLine}

*Total a pagar: $${formatCOP(summary.finalTotal)} COP*`
    );
}

function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function submitOrder() {
    const customerData = validateCheckoutForm();
    if (!customerData) return;
    const message = generateWhatsAppMessage(customerData);
    const phone = WHATSAPP_NUMBER.replace('+', '');
    const encoded = encodeURIComponent(message);

    if (isMobileDevice()) {
        // Mobile: öffnet die native WhatsApp App direkt
        window.location.href = `whatsapp://send?phone=${phone}&text=${encoded}`;
    } else {
        // Desktop: öffnet WhatsApp Web in neuem Tab
        window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    }
    closeCheckoutModal();
}

// ──────────────────────────────────────────

loadCart();

const cartBarButton = document.getElementById('cartBarButton');
if (cartBarButton) cartBarButton.addEventListener('click', openBasket);

const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
if (cartCheckoutBtn) cartCheckoutBtn.addEventListener('click', openCheckoutModal);

const checkoutModalClose = document.getElementById('checkoutModalClose');
if (checkoutModalClose) checkoutModalClose.addEventListener('click', closeCheckoutModal);

const checkoutModalOverlay = document.getElementById('checkoutModalOverlay');
if (checkoutModalOverlay) checkoutModalOverlay.addEventListener('click', closeCheckoutModal);

const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', function (e) {
        e.preventDefault();
        submitOrder();
    });
}

updateCartUI();
