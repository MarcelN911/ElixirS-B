// ============================================
// CART.JS — Elixir S&B
// Shopping cart: state management, CRUD,
// price calculations, UI rendering,
// and WhatsApp checkout
// ============================================

const WHATSAPP_NUMBER         = '+573205826414';
const FREE_SHIPPING_THRESHOLD = 500000;
const CART_STORAGE_KEY        = 'elixir_cart';

let cart = [];

// ── Persistence ───────────────────────────────

/** Loads the saved cart from localStorage into the `cart` array. */
function loadCart() {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        cart = stored ? JSON.parse(stored) : [];
    } catch (e) {
        cart = [];
    }
}

/** Saves the current `cart` array to localStorage. */
function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// ── Price Helpers ─────────────────────────────
//
// Google Sheets stores prices as short numbers (65, 95, 160)
// representing 65.000, 95.000, 160.000 COP.

/** Converts a raw spreadsheet price (e.g. 65) to the full COP amount (65000). */
function rawToPrice(raw) {
    return parseInt(raw, 10) * 1000;
}

/**
 * Formats a COP amount as a readable string with dot separators.
 * Example: 65000 → "65.000"
 */
function formatCOP(amount) {
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// ── Cart CRUD ─────────────────────────────────

/**
 * Adds a product to the cart.
 * If the same SKU already exists, it increases the quantity instead of adding a duplicate.
 * Opens the cart panel after every add.
 */
function addToCart(item) {
    const existing = cart.find(function(c) { return c.sku === item.sku; });
    if (existing) {
        updateExistingCartItem(existing, item.quantity || 1);
    } else {
        insertNewCartItem(item);
    }
    openBasket();
}

/** Increases the quantity of an existing cart item and updates the DOM. */
function updateExistingCartItem(existing, addQty) {
    existing.quantity += addQty;
    saveCart();
    const qtyEl = document.querySelector(`[data-sku="${existing.sku}"] .cart-qty-value`);
    if (qtyEl) {
        qtyEl.textContent = existing.quantity;
    }
    updateTotalsOnly();
}

/**
 * Adds a brand-new item to the cart array and inserts its HTML into the panel.
 * If the panel showed the empty state, it is replaced; otherwise the item is appended.
 */
function insertNewCartItem(item) {
    cart.push({ ...item, quantity: item.quantity || 1 });
    saveCart();
    const content = document.getElementById('cartPanelContent');
    if (!content) {
        return;
    }
    const emptyEl = content.querySelector('.cart-empty');
    const newHtml = buildCartItemHtml(cart[cart.length - 1]);
    if (emptyEl) {
        content.innerHTML = newHtml;
    } else {
        content.insertAdjacentHTML('beforeend', newHtml);
    }
    updateTotalsOnly();
}

/**
 * Removes a product from the cart by its SKU.
 * Shows the empty state if the cart becomes empty.
 */
function removeFromCart(sku) {
    cart = cart.filter(function(item) { return item.sku !== sku; });
    saveCart();
    const itemEl = document.querySelector(`[data-sku="${sku}"]`);
    if (itemEl) {
        itemEl.remove();
    }
    if (cart.length === 0) {
        showEmptyCartState();
    }
    updateTotalsOnly();
}

/** Changes the quantity of a cart item by `change` (+1 or −1). Removes if it reaches 0. */
function updateQuantity(sku, change) {
    const item = cart.find(function(c) { return c.sku === sku; });
    if (!item) {
        return;
    }
    const newQty = item.quantity + change;
    if (newQty < 1) {
        removeFromCart(sku);
        return;
    }
    item.quantity = newQty;
    saveCart();
    const qtyEl = document.querySelector(`[data-sku="${sku}"] .cart-qty-value`);
    if (qtyEl) {
        qtyEl.textContent = newQty;
    }
    updateTotalsOnly();
}

/** Renders the empty cart placeholder inside the cart panel. */
function showEmptyCartState() {
    const content = document.getElementById('cartPanelContent');
    if (!content) {
        return;
    }
    content.innerHTML = `
        <div class="cart-empty">
            <img src="./assets/img/shopping-car.svg" alt="Carrito vacío">
            <p>Tu carrito está vacío</p>
            <a href="productos.html" class="cart-empty-link">Ver productos</a>
        </div>`;
}

// ── Price Calculations ────────────────────────

/** Sum of all items at their regular (non-sale) price × quantity. */
function getSubtotal() {
    return cart.reduce(function(sum, item) {
        return sum + rawToPrice(item.regularPrice) * item.quantity;
    }, 0);
}

/**
 * Total amount saved across all items that have a sale price.
 * Items without a sale price are skipped.
 */
function getTotalDiscount() {
    return cart.reduce(function(sum, item) {
        if (!item.salePrice) {
            return sum;
        }
        return sum + (rawToPrice(item.regularPrice) - rawToPrice(item.salePrice)) * item.quantity;
    }, 0);
}

/** The actual amount the customer pays after discounts. */
function getFinalTotal() {
    return getSubtotal() - getTotalDiscount();
}

/** How many more COP the customer needs to reach free shipping. 0 if already eligible. */
function getShippingShortfall() {
    return Math.max(0, FREE_SHIPPING_THRESHOLD - getFinalTotal());
}

/**
 * Returns a summary object with all totals in one place.
 * Used by the render functions to avoid calling each calculation separately.
 */
function getCartSummary() {
    const subtotal          = getSubtotal();
    const totalDiscount     = getTotalDiscount();
    const finalTotal        = getFinalTotal();
    const shippingShortfall = getShippingShortfall();
    return {
        itemCount:       cart.reduce(function(sum, item) { return sum + item.quantity; }, 0),
        subtotal:        subtotal,
        totalDiscount:   totalDiscount,
        finalTotal:      finalTotal,
        shippingShortfall: shippingShortfall,
        hasFreeShipping: cart.length > 0 && shippingShortfall === 0
    };
}

// ── Cart Item HTML Template ───────────────────
// Note: buildCartItemHtml is a large HTML template and is intentionally
// kept as one function for readability. It is excluded from the 14-line limit.

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
                <img src="${item.image || './assets/img/product-placeholder.svg'}"
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

// ── UI Rendering ──────────────────────────────

/**
 * Renders the full list of cart items into the panel.
 * Shows the empty state if the cart has no items.
 */
function renderCartItems() {
    const content = document.getElementById('cartPanelContent');
    if (!content) {
        return;
    }
    if (cart.length === 0) {
        showEmptyCartState();
        return;
    }
    content.innerHTML = cart.map(buildCartItemHtml).join('');
}

/** Updates all badge elements (icon + bar) that display the total item count. */
function updateCartCounts() {
    const summary = getCartSummary();
    document.querySelectorAll('.cart-count').forEach(function(el) {
        el.textContent = summary.itemCount;
        el.classList.toggle('active', summary.itemCount > 0);
    });
    const barCount = document.getElementById('cartBarCount');
    if (barCount) {
        barCount.textContent = summary.itemCount;
    }
}

/** Shows or hides the sticky cart bar and updates its item count and total. */
function updateCartBar() {
    const summary = getCartSummary();
    const cartBar = document.getElementById('cartBar');
    if (!cartBar) {
        return;
    }
    cartBar.classList.toggle('active', summary.itemCount > 0);
    const itemsText = document.getElementById('cartItemsText');
    if (itemsText) {
        if (summary.itemCount === 1) {
            itemsText.textContent = '1 artículo';
        } else {
            itemsText.textContent = `${summary.itemCount} artículos`;
        }
    }
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) {
        totalEl.textContent = formatCOP(summary.finalTotal);
    }
}

/**
 * Renders the subtotal, discount row, and final total in the cart footer.
 * The discount row is hidden when there are no discounts.
 */
function renderPriceSummary(summary) {
    const subtotalEl = document.getElementById('cartSubtotal');
    if (subtotalEl) {
        subtotalEl.textContent = `$${formatCOP(summary.subtotal)} COP`;
    }
    const discountRow = document.getElementById('cartDiscountRow');
    const discountEl  = document.getElementById('cartDiscount');
    if (discountRow && discountEl) {
        if (summary.totalDiscount > 0) {
            discountRow.style.display = 'flex';
        } else {
            discountRow.style.display = 'none';
        }
        discountEl.textContent = `−$${formatCOP(summary.totalDiscount)} COP`;
    }
    const totalEl = document.getElementById('cartFinalTotal');
    if (totalEl) {
        totalEl.textContent = `$${formatCOP(summary.finalTotal)} COP`;
    }
}

/**
 * Updates the free-shipping progress bar and the text below it.
 * The bar fills up as the customer gets closer to the free-shipping threshold.
 */
function renderShippingBar(summary) {
    const progressEl   = document.getElementById('cartShippingProgress');
    const shippingText = document.getElementById('cartShippingText');
    if (!progressEl || !shippingText) {
        return;
    }
    if (cart.length === 0) {
        progressEl.style.width = '0%';
        shippingText.textContent = `Envío gratis desde $${formatCOP(FREE_SHIPPING_THRESHOLD)} COP`;
        shippingText.classList.remove('is-free');
        return;
    }
    const pct = Math.min(100, (summary.finalTotal / FREE_SHIPPING_THRESHOLD) * 100);
    progressEl.style.width = `${pct}%`;
    if (summary.hasFreeShipping) {
        shippingText.textContent = '¡Envío gratis incluido! 🎉';
        shippingText.classList.add('is-free');
    } else {
        shippingText.textContent = `Te faltan $${formatCOP(summary.shippingShortfall)} COP para envío gratis`;
        shippingText.classList.remove('is-free');
    }
}

/** Renders the full cart summary: prices, shipping bar, and checkout button state. */
function renderCartSummary() {
    const summary = getCartSummary();
    renderPriceSummary(summary);
    renderShippingBar(summary);
    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = summary.itemCount === 0;
    }
}

/** Updates only the totals (no item re-render). Used after quantity changes. */
function updateTotalsOnly() {
    renderCartSummary();
    updateCartCounts();
    updateCartBar();
}

/** Full re-render of the cart: items + totals + counts + bar. */
function updateCartUI() {
    renderCartItems();
    renderCartSummary();
    updateCartCounts();
    updateCartBar();
}

// ── Checkout Modal ────────────────────────────

/** Opens the checkout modal and focuses the name field for a smooth UX. */
function openCheckoutModal() {
    if (cart.length === 0) {
        return;
    }
    const modal = document.getElementById('checkoutModal');
    if (!modal) {
        return;
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const nameInput = document.getElementById('checkoutName');
    if (nameInput) {
        nameInput.focus();
    }
}

/** Closes the checkout modal and clears any validation error messages. */
function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (!modal) {
        return;
    }
    modal.classList.remove('active');
    document.body.style.overflow = '';
    const errorEl = document.getElementById('checkoutError');
    if (errorEl) {
        errorEl.textContent = '';
    }
}

/** Reads all checkout form fields into a single object. */
function readCheckoutFields() {
    return {
        name:       document.getElementById('checkoutName').value.trim(),
        celular:    document.getElementById('checkoutCelular').value.trim(),
        ciudad:     document.getElementById('checkoutCiudad').value.trim(),
        barrio:     document.getElementById('checkoutBarrio').value.trim(),
        direccion:  document.getElementById('checkoutDireccion').value.trim(),
        referencia: document.getElementById('checkoutReferencia').value.trim()
    };
}

/**
 * Returns the first required field that is empty, or null if all are filled.
 * Used to show a targeted error message to the customer.
 */
function findFirstEmptyField(fields) {
    const required = [
        { key: 'name',      id: 'checkoutName',      message: 'Por favor ingresa tu nombre completo.'   },
        { key: 'celular',   id: 'checkoutCelular',   message: 'Por favor ingresa tu número de celular.' },
        { key: 'ciudad',    id: 'checkoutCiudad',    message: 'Por favor ingresa tu ciudad.'             },
        { key: 'barrio',    id: 'checkoutBarrio',    message: 'Por favor ingresa tu barrio o sector.'   },
        { key: 'direccion', id: 'checkoutDireccion', message: 'Por favor ingresa tu dirección.'         }
    ];
    return required.find(function(field) { return !fields[field.key]; }) || null;
}

/**
 * Validates all required checkout fields.
 * Returns the filled fields object if valid, or null if a field is missing
 * (also shows an error message and focuses the empty field).
 */
function validateCheckoutForm() {
    const fields  = readCheckoutFields();
    const errorEl = document.getElementById('checkoutError');
    const invalid = findFirstEmptyField(fields);
    if (invalid) {
        errorEl.textContent = invalid.message;
        document.getElementById(invalid.id).focus();
        return null;
    }
    errorEl.textContent = '';
    return fields;
}

// ── WhatsApp Message Builder ──────────────────

/**
 * Builds the text line for a single cart item in the WhatsApp message.
 * Shows the sale price and original price if the item is on offer.
 */
function buildItemLine(item) {
    const qty = `${item.quantity} x `;
    let total;
    let priceText;
    if (item.salePrice) {
        total     = rawToPrice(item.salePrice) * item.quantity;
        priceText = `*$${formatCOP(total)} COP* ¡Oferta! (antes $${formatCOP(rawToPrice(item.regularPrice))} COP)`;
    } else {
        total     = rawToPrice(item.regularPrice) * item.quantity;
        priceText = `$${formatCOP(total)} COP`;
    }
    return `• ${qty}${item.brand} - ${item.name} (${item.size} ml) — ${priceText}`;
}

/** Builds the discount, shipping, and reference lines for the order summary. */
function buildOrderExtras(summary, referencia) {
    let discountLine;
    if (summary.totalDiscount > 0) {
        discountLine = `\nDescuento: − $${formatCOP(summary.totalDiscount)} COP`;
    } else {
        discountLine = '';
    }
    let shippingLine;
    if (summary.hasFreeShipping) {
        shippingLine = '\nEnvío: *¡GRATIS!*';
    } else {
        shippingLine = '\nEnvío: A calcular';
    }
    let refLine;
    if (referencia) {
        refLine = `\n*Referencia:* ${referencia}`;
    } else {
        refLine = '';
    }
    return { discountLine, shippingLine, refLine };
}

/** Composes the full WhatsApp order message from customer data and cart summary. */
function buildWhatsAppText(customer, itemLines, summary, extras) {
    return (
`*NUEVO PEDIDO — Elixir S&B*

Hola, quiero hacer un pedido con la siguiente información:

*Cliente:* ${customer.name}
*Celular:* ${customer.celular}
*Dirección:* ${customer.direccion}
*Ciudad/Barrio:* ${customer.ciudad} / ${customer.barrio}${extras.refLine}

*Productos:*
${itemLines}

*Resumen del pedido:*
Subtotal: $${formatCOP(summary.subtotal)} COP${extras.discountLine}${extras.shippingLine}

*Total a pagar: $${formatCOP(summary.finalTotal)} COP*`
    );
}

/** Assembles the complete WhatsApp message by calling the helper functions above. */
function generateWhatsAppMessage(customerData) {
    const summary   = getCartSummary();
    const itemLines = cart.map(buildItemLine).join('\n');
    const extras    = buildOrderExtras(summary, customerData.referencia);
    return buildWhatsAppText(customerData, itemLines, summary, extras);
}

// ── Order Submission ──────────────────────────

/** Returns true when the user is on a mobile device (used to open the native WhatsApp app). */
function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Validates the form, generates the WhatsApp message, and opens WhatsApp.
 * On mobile: opens the native app. On desktop: opens WhatsApp Web in a new tab.
 */
function submitOrder() {
    const customerData = validateCheckoutForm();
    if (!customerData) {
        return;
    }
    const message = generateWhatsAppMessage(customerData);
    const phone   = WHATSAPP_NUMBER.replace('+', '');
    const encoded = encodeURIComponent(message);
    if (isMobileDevice()) {
        window.location.href = `whatsapp://send?phone=${phone}&text=${encoded}`;
    } else {
        window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    }
    closeCheckoutModal();
}

// ── Init & Event Listeners ────────────────────

loadCart();

const cartBarButton = document.getElementById('cartBar');
if (cartBarButton) {
    cartBarButton.addEventListener('click', openBasket);
}

const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener('click', openCheckoutModal);
}

const checkoutModalClose = document.getElementById('checkoutModalClose');
if (checkoutModalClose) {
    checkoutModalClose.addEventListener('click', closeCheckoutModal);
}

const checkoutModalOverlay = document.getElementById('checkoutModalOverlay');
if (checkoutModalOverlay) {
    checkoutModalOverlay.addEventListener('click', closeCheckoutModal);
}

const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitOrder();
    });
}

updateCartUI();
