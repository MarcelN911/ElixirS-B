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
    const db = await fetch(productsUrl);
    const content = await db.text();

    json = JSON.parse(content.substring(47).slice(0, -2));
    data = json.table.rows;
    for (let index = 0; index < data.length; index++) {
        if (data[index].c[7].v === 'No') continue;
        if (data[index].c[7] && data[index].c[7].v === 'Si') {
            const product = createProductData(data, index);
            createBestsellerTemplate(product);
        }
    }
}

fetchBestsellers();

function updateQuote(row) {
    if (row[0] && row[0].v && row[1] && row[1].v) {
        document.getElementById('quoteText').textContent = '"' + row[0].v + '"';
        document.getElementById('quoteAuthor').textContent = '— ' + row[1].v;
    }
}

function collectReviews(rows) {
    const reviews = [];
    for (let index = 0; index < rows.length; index++) {
        if (rows[index].c[4] && rows[index].c[4].v) {
            reviews.push({
                stars: rows[index].c[3] ? rows[index].c[3].v : 5,
                text: rows[index].c[4].v,
                name: rows[index].c[5] ? rows[index].c[5].v : 'Anónimo',
                city: rows[index].c[6] ? rows[index].c[6].v : ''
            });
        }
    }
    return reviews;
}

function loadReviews(reviews) {
    const container = document.getElementById('testimonialsCarousel');
    container.innerHTML = '';
    for (let index = 0; index < reviews.length; index++) {
        createReviewTemplate(reviews[index]);
    }
}

async function fetchContent() {
    const db = await fetch(dbUrl);
    const content = await db.text();
    const json = JSON.parse(content.substring(47).slice(0, -2));
    const rows = json.table.rows;
    if (rows.length === 0) return;
    updateQuote(rows[0].c);
    const reviews = collectReviews(rows);
    if (reviews.length > 0) loadReviews(reviews);
}

function getScrollAmount(carousel) {
    const card = carousel.querySelector('.product-card');
    if (!card) return 300;
    return card.offsetWidth + 25;
}

function setupBestsellersNav() {
    const carousel = document.getElementById('bestsellersCarousel');
    const btnLeft = document.getElementById('scrollLeft');
    const btnRight = document.getElementById('scrollRight');
    btnLeft.addEventListener('click', function() {
        carousel.scrollBy({ left: -getScrollAmount(carousel), behavior: 'smooth' });
    });
    btnRight.addEventListener('click', function() {
        carousel.scrollBy({ left: getScrollAmount(carousel), behavior: 'smooth' });
    });
}

setupBestsellersNav();

function getReviewScrollAmount(carousel) {
    const card = carousel.querySelector('.testimonial-card');
    if (!card) return 300;
    return card.offsetWidth + 25;
}

function setupReviewsNav() {
    const carousel = document.getElementById('testimonialsCarousel');
    const btnLeft = document.getElementById('reviewScrollLeft');
    const btnRight = document.getElementById('reviewScrollRight');
    btnLeft.addEventListener('click', function() {
        carousel.scrollBy({ left: -getReviewScrollAmount(carousel), behavior: 'smooth' });
    });
    btnRight.addEventListener('click', function() {
        carousel.scrollBy({ left: getReviewScrollAmount(carousel), behavior: 'smooth' });
    });
}

setupReviewsNav();
fetchContent();

function setupReels() {
    const reels = document.getElementById('socialReels');
    if (!reels) return;

    const centerItem = reels.querySelector('[data-role="center"]');
    const centerVideo = centerItem ? centerItem.querySelector('.social-reel-video') : null;
    const sideItems = reels.querySelectorAll('[data-role="side"]');

    if (centerVideo) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && window.innerWidth >= 900) {
                    centerVideo.play();
                } else {
                    centerVideo.pause();
                }
            });
        }, { threshold: 0.5 });
        observer.observe(centerItem);
    }

    if (window.innerWidth < 600) {
        setupMobileCarousel(reels);
        return;
    }

    // Desktop: Hover-Logik für Seiten-Videos
    sideItems.forEach(item => {
        const video = item.querySelector('.social-reel-video');
        item.addEventListener('mouseenter', () => {
            if (window.innerWidth < 900) return;
            video.play();
            if (centerVideo) centerVideo.pause();
        });
        item.addEventListener('mouseleave', () => {
            if (window.innerWidth < 900) return;
            video.pause();
            video.currentTime = 0;
            if (centerVideo && window.innerWidth >= 900) centerVideo.play();
        });
    });
}
