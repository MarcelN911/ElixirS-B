// ── NEXOMAR Discount Widget ─────────────────────────────────────────────────
// Self-contained, shopId-driven promo widget for NEXOMAR storefronts.
// Fetches the shop's featured discount from /api/public/discount and injects
// an announcement bar + modal. Renders nothing if the shop has no discounts
// configured for the storefront (no destacado, no enLeiste, no extraItems).
//
// This file is identical across every storefront that uses it — do not fork
// it per site. Per-site look is done entirely in discount-widget.css; per-site
// config (shopId, apiBase, extra non-discount bar lines, header selector) is
// set via window.NXDW_CONFIG, defined in a small inline <script> before this
// file loads. Falls back to window._shopId / window._apiBase when present.
(function () {
    'use strict';

    var CFG = window.NXDW_CONFIG || {};

    // Host pages declare `const _shopId`/`const _apiBase` at the top level of a
    // classic <script> — that creates a shared global binding other scripts can
    // read as a bare identifier, but NOT a window.* property (only `var` does
    // that). So we read the raw identifier here, guarded for pages that never
    // declare it at all (those must set window.NXDW_CONFIG explicitly instead).
    var hostShopId, hostApiBase;
    try { hostShopId = _shopId; } catch (_) { hostShopId = undefined; }
    try { hostApiBase = _apiBase; } catch (_) { hostApiBase = undefined; }

    var shopId           = CFG.shopId  || hostShopId;
    var apiBase          = CFG.apiBase || hostApiBase;
    var headerSelector   = CFG.headerSelector   || 'header';
    var extraItems       = CFG.extraItems       || [];
    var scrollThreshold  = CFG.scrollThreshold  || 30;
    var autoOpenDelay    = CFG.autoOpenDelay    || 4000;
    var reopenDelay      = CFG.reopenDelay      || 120000; // 2 min — how long after a dismiss before it tries once more
    var rotateInterval   = CFG.rotateInterval   || 4500;
    var privacyUrl       = CFG.privacyUrl       || 'privacidad.html';
    var eyebrowText      = CFG.eyebrowText      || 'Oferta especial';

    if (!shopId || !apiBase) return;

    var STORAGE_KEY   = 'nxdw_registrado_' + shopId;
    var CLOSES_KEY    = 'nxdw_cierres_' + shopId;
    var NEXT_OPEN_KEY = 'nxdw_reintento_' + shopId;
    var discountUrl  = apiBase + '/api/public/discount?shopId=' + shopId;
    var registerUrl  = apiBase + '/api/public/register';

    var destacado  = null; // { codigo, porcentaje, descripcion, imagen }
    var barVisible = false;

    // ── Markup injection ────────────────────────────────────────────────────

    function injectMarkup() {
        var bar = document.createElement('div');
        bar.className = 'nxdw-bar';
        bar.id = 'nxdwBar';
        bar.setAttribute('aria-live', 'polite');
        bar.innerHTML = '<div class="nxdw-bar-items" id="nxdwBarItems"></div>';
        document.body.appendChild(bar);

        var overlay = document.createElement('div');
        overlay.className = 'nxdw-overlay';
        overlay.id = 'nxdwOverlay';
        overlay.innerHTML =
            '<div class="nxdw-modal">' +
                '<button type="button" class="nxdw-close" id="nxdwClose" aria-label="Cerrar">&times;</button>' +
                '<div class="nxdw-img-wrap nxdw-hidden" id="nxdwImgWrap"><img id="nxdwImg" alt=""></div>' +
                '<div class="nxdw-body">' +
                    '<div id="nxdwForm">' +
                        '<div class="nxdw-ornament"><span></span><em>&#10022;</em><span></span></div>' +
                        '<p class="nxdw-eyebrow">' + eyebrowText + '</p>' +
                        '<h2 class="nxdw-title"><em id="nxdwPct"></em> descuento</h2>' +
                        '<p class="nxdw-sub" id="nxdwSub"></p>' +
                        '<div class="nxdw-divider"></div>' +
                        '<div class="nxdw-fields">' +
                            '<input class="nxdw-input" type="text" id="nxdwNombre" placeholder="Tu nombre" autocomplete="name">' +
                            '<input class="nxdw-input" type="tel" id="nxdwTelefono" placeholder="WhatsApp (con código país)" autocomplete="tel">' +
                        '</div>' +
                        '<div class="nxdw-error" id="nxdwError"></div>' +
                        '<button type="button" class="nxdw-btn" id="nxdwSubmitBtn"><span>Obtener código</span><span class="nxdw-btn-spinner"></span></button>' +
                        '<p class="nxdw-privacy">Solo usamos tus datos para enviarte tu código. Sin spam. <a href="' + privacyUrl + '" target="_blank" rel="noopener">Política de privacidad</a></p>' +
                    '</div>' +
                    '<div class="nxdw-success nxdw-hidden" id="nxdwSuccess">' +
                        '<div class="nxdw-success-icon">&#10003;</div>' +
                        '<h3 class="nxdw-success-title">¡Listo!</h3>' +
                        '<p class="nxdw-success-sub">Tu código de descuento es:</p>' +
                        '<p class="nxdw-success-desc nxdw-hidden" id="nxdwSuccessDesc"></p>' +
                        '<div class="nxdw-code-box">' +
                            '<span class="nxdw-code-text" id="nxdwCodeText"></span>' +
                            '<button type="button" class="nxdw-copy-btn" id="nxdwCopyBtn">Copiar</button>' +
                        '</div>' +
                        '<button type="button" class="nxdw-done-btn" id="nxdwDoneBtn">Seguir comprando</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);
    }

    function removeMarkup() {
        var bar     = document.getElementById('nxdwBar');
        var overlay = document.getElementById('nxdwOverlay');
        if (bar) bar.parentNode.removeChild(bar);
        if (overlay) overlay.parentNode.removeChild(overlay);
    }

    // ── Announcement bar ─────────────────────────────────────────────────────

    function buildBarLines(barra) {
        var lines = extraItems.map(function (e) { return { texto: e.texto, clickable: false, codigo: null }; });
        (barra || []).forEach(function (b) {
            // The destacado code stays hidden behind the modal's form on purpose —
            // every other ("public") bar code gets a copy button since its code
            // is already shown in plain text right next to it.
            var isDestacado = !!(destacado && b.codigo === destacado.codigo);
            lines.push({ texto: b.texto, clickable: isDestacado, codigo: isDestacado ? null : b.codigo });
        });
        return lines;
    }

    function renderBar(barra) {
        var lines = buildBarLines(barra);
        if (!lines.length) return false;
        var wrap = document.getElementById('nxdwBarItems');
        wrap.innerHTML = lines.map(function (l) {
            var copyBtn = l.codigo
                ? '<button type="button" class="nxdw-bar-copy" data-code="' + l.codigo + '" aria-label="Copiar código" title="Copiar código">' +
                    '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>' +
                  '</button>'
                : '';
            return '<span class="nxdw-bar-item' + (l.clickable ? ' nxdw-bar-item--click' : '') + '" data-clickable="' + (l.clickable ? '1' : '0') + '">' +
                '<span class="nxdw-bar-gem">&#10022;</span><span>' + l.texto + '</span>' + copyBtn +
            '</span>';
        }).join('');
        if (wrap.firstElementChild) wrap.firstElementChild.classList.add('nxdw-active');
        return true;
    }

    function initBarCopy() {
        document.getElementById('nxdwBarItems').addEventListener('click', function (e) {
            var btn = e.target.closest ? e.target.closest('.nxdw-bar-copy') : null;
            if (!btn) return;
            e.stopPropagation();
            var code = btn.getAttribute('data-code');
            navigator.clipboard.writeText(code).then(function () {
                btn.classList.add('nxdw-bar-copy--done');
                setTimeout(function () { btn.classList.remove('nxdw-bar-copy--done'); }, 1400);
            }).catch(function () {});
        });
    }

    function cycleBar() {
        var wrap = document.getElementById('nxdwBarItems');
        var els  = wrap ? Array.prototype.slice.call(wrap.children) : [];
        if (els.length < 2) return;
        var idx = -1;
        for (var i = 0; i < els.length; i++) if (els[i].classList.contains('nxdw-active')) idx = i;
        if (idx > -1) els[idx].classList.remove('nxdw-active');
        els[(idx + 1) % els.length].classList.add('nxdw-active');
    }

    // Uses `top`, not `transform` — a transform on the header would make it the
    // containing block for any position:fixed descendant (e.g. a mobile menu
    // panel nested inside <header>), breaking that descendant's sizing/backdrop.
    function setHeaderOffset(px) {
        var header = document.querySelector(headerSelector);
        if (header) header.style.top = px ? px + 'px' : '';
    }

    function initScroll() {
        var bar = document.getElementById('nxdwBar');
        function onScroll() {
            var shouldShow = window.scrollY > scrollThreshold;
            if (shouldShow === barVisible) return;
            barVisible = shouldShow;
            bar.classList.toggle('nxdw-bar--visible', shouldShow);
            setHeaderOffset(shouldShow ? bar.offsetHeight : 0);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    // ── Modal ────────────────────────────────────────────────────────────────

    function populateModal() {
        document.getElementById('nxdwPct').textContent = destacado.porcentaje + '%';
        document.getElementById('nxdwSub').textContent = destacado.descripcion || 'en tu primera compra';
        var imgWrap = document.getElementById('nxdwImgWrap');
        var img     = document.getElementById('nxdwImg');
        var modal   = document.querySelector('#nxdwOverlay .nxdw-modal');
        if (destacado.imagen) {
            img.src = destacado.imagen;
            imgWrap.classList.remove('nxdw-hidden');
            if (modal) modal.classList.remove('nxdw-no-img');
        } else {
            imgWrap.classList.add('nxdw-hidden');
            if (modal) modal.classList.add('nxdw-no-img');
        }
    }

    function openModal() {
        var overlay = document.getElementById('nxdwOverlay');
        if (!overlay || !destacado) return;
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                var parsed = JSON.parse(saved);
                if (parsed.code) showSuccess(parsed.code);
            } catch (_) {}
        }
        overlay.classList.add('nxdw-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        var overlay = document.getElementById('nxdwOverlay');
        if (!overlay) return;
        overlay.classList.remove('nxdw-open');
        document.body.style.overflow = '';
    }

    // Re-checks dismiss state right before actually opening — guards against
    // a stray timer (e.g. one scheduled before a second dismiss just now)
    // still firing and reopening the modal after the visitor said "no" twice.
    // Manual opens (bar click) go through openModal() directly and skip this.
    function autoOpen() {
        if (localStorage.getItem(STORAGE_KEY)) return;
        if (parseInt(localStorage.getItem(CLOSES_KEY) || '0', 10) >= 2) return;
        openModal();
    }

    // First dismiss (without registering) → try once more in `reopenDelay`,
    // whether the visitor stays on this page (timer below) or navigates to
    // another one (the persisted timestamp picks up where it left off via
    // scheduleAutoOpen on the next page load). Second dismiss → stop
    // auto-opening for good. Registering cancels all of this.
    function handleUserClose() {
        if (!localStorage.getItem(STORAGE_KEY)) {
            var closes = parseInt(localStorage.getItem(CLOSES_KEY) || '0', 10) + 1;
            localStorage.setItem(CLOSES_KEY, String(closes));
            if (closes === 1) {
                localStorage.setItem(NEXT_OPEN_KEY, String(Date.now() + reopenDelay));
                setTimeout(autoOpen, reopenDelay);
            }
        }
        closeModal();
    }

    // Decides whether/when the modal should auto-open, based on past dismissals.
    function scheduleAutoOpen() {
        if (localStorage.getItem(STORAGE_KEY)) return; // already registered

        var closes = parseInt(localStorage.getItem(CLOSES_KEY) || '0', 10);
        if (closes === 0) { setTimeout(autoOpen, autoOpenDelay); return; }
        if (closes >= 2) return; // dismissed twice — stop bothering the visitor

        var nextOpenAt = parseInt(localStorage.getItem(NEXT_OPEN_KEY) || '0', 10);
        var remaining  = nextOpenAt - Date.now();
        setTimeout(autoOpen, remaining > 0 ? remaining : autoOpenDelay);
    }

    function showSuccess(code) {
        document.getElementById('nxdwForm').style.display    = 'none';
        document.getElementById('nxdwSuccess').classList.remove('nxdw-hidden');
        document.getElementById('nxdwCodeText').textContent  = code;
    }

    function setError(msg) {
        var el = document.getElementById('nxdwError');
        if (el) el.textContent = msg;
    }

    function handleSubmit() {
        var nombre   = document.getElementById('nxdwNombre').value.trim();
        var telefono = document.getElementById('nxdwTelefono').value.trim();

        setError('');
        if (!nombre)   { setError('Por favor ingresa tu nombre.'); return; }
        if (!telefono) { setError('Por favor ingresa tu número de WhatsApp.'); return; }

        var btn = document.getElementById('nxdwSubmitBtn');
        btn.disabled = true;
        btn.classList.add('nxdw-loading');

        fetch(registerUrl, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ shopId: shopId, nombre: nombre, telefono: telefono, codigoDescuento: destacado.codigo })
        })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
            if (!r.ok) { setError(r.data.error || 'Ocurrió un error. Intenta de nuevo.'); return; }
            var code = r.data.codigoDescuento || destacado.codigo;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: code, nombre: r.data.nombre }));
            showSuccess(code);
        })
        .catch(function () { setError('Error de conexión. Intenta de nuevo.'); })
        .finally(function () {
            btn.disabled = false;
            btn.classList.remove('nxdw-loading');
        });
    }

    function initCopyBtn() {
        var btn  = document.getElementById('nxdwCopyBtn');
        var code = document.getElementById('nxdwCodeText');
        btn.addEventListener('click', function () {
            navigator.clipboard.writeText(code.textContent).then(function () {
                btn.textContent = '✓ Copiado';
                btn.classList.add('nxdw-copied');
                setTimeout(function () {
                    btn.textContent = 'Copiar';
                    btn.classList.remove('nxdw-copied');
                }, 2000);
            }).catch(function () {});
        });
    }

    function wireEvents() {
        var overlay = document.getElementById('nxdwOverlay');
        var bar     = document.getElementById('nxdwBar');

        overlay.addEventListener('click', function (e) { if (e.target === overlay) handleUserClose(); });
        document.getElementById('nxdwClose').addEventListener('click', handleUserClose);
        document.getElementById('nxdwDoneBtn').addEventListener('click', closeModal);
        document.getElementById('nxdwSubmitBtn').addEventListener('click', handleSubmit);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('nxdw-open')) handleUserClose();
        });
        initCopyBtn();
        initBarCopy();

        bar.addEventListener('click', function (e) {
            var item = e.target.closest ? e.target.closest('.nxdw-bar-item--click') : null;
            if (item) openModal();
        });
    }

    // ── Init ─────────────────────────────────────────────────────────────────

    function init() {
        injectMarkup();

        fetch(discountUrl)
            .then(function (r) { return r.json(); })
            .catch(function () { return { found: false, destacado: null, barra: [] }; })
            .then(function (data) {
                destacado = data.destacado || null;
                var hasBar = renderBar(data.barra);

                if (!hasBar) { removeMarkup(); return; }

                wireEvents();
                initScroll();
                setInterval(cycleBar, rotateInterval);

                if (destacado) {
                    populateModal();
                    scheduleAutoOpen();
                } else {
                    var overlay = document.getElementById('nxdwOverlay');
                    if (overlay) overlay.parentNode.removeChild(overlay);
                }
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
