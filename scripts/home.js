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
        if (data[index].c[6] && data[index].c[6].v === 'Si') {
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

function collectPhotos(rows) {
    const photos = [];
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].c[4] && rows[i].c[4].v) {
            photos.push(rows[i].c[4].v);
        }
    }
    return photos;
}

async function fetchContent() {
    const db = await fetch(dbUrl);
    const content = await db.text();
    const json = JSON.parse(content.substring(47).slice(0, -2));
    const rows = json.table.rows;
    if (rows.length === 0) return;
    updateQuote(rows[0].c);
    const photos = collectPhotos(rows);
    if (photos.length > 0) {
        loadPhotos(photos);
    }
}

function setPhotoWithFallback(img, src, fallback) {
    img.onerror = function() {
        img.onerror = null;
        img.src = fallback;
    };
    img.src = src;
}

function loadPhotos(photos) {
    const photoIds = ['socialPhoto1', 'socialPhoto2', 'socialPhoto3', 'socialPhoto4'];
    const fallback = './img/instagram/post-2.svg';
    for (let i = 0; i < photoIds.length; i++) {
        if (photos[i]) {
            const img = document.getElementById(photoIds[i]);
            setPhotoWithFallback(img, photos[i], fallback);
        }
    }
    if (photos.length > 4) {
        startSlideshow(photos, photoIds, fallback);
    }
}

function swapPhoto(photoIds, photos, currentBox, currentIndex, fallback) {
    const img = document.getElementById(photoIds[currentBox]);
    img.style.opacity = '0';
    setTimeout(function() {
        setPhotoWithFallback(img, photos[currentIndex], fallback);
        img.style.opacity = '1';
    }, 800);
}

function startSlideshow(photos, photoIds, fallback) {
    let currentIndex = 4;
    let currentBox = 0;
    setInterval(function() {
        swapPhoto(photoIds, photos, currentBox, currentIndex, fallback);
        currentBox = (currentBox + 1) % photoIds.length;
        currentIndex = (currentIndex + 1) % photos.length;
    }, 3500);
}

function handleVideoVisibility(entry, video, container) {
    if (entry.isIntersecting) {
        video.play().then(function() {
            container.classList.add('playing');
        }).catch(function() {});
    } else {
        video.pause();
        container.classList.remove('playing');
    }
}

function setupVideoAutoplay() {
    const video = document.getElementById('socialVideo');
    const container = document.getElementById('socialVideoContainer');
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            handleVideoVisibility(entry, video, container);
        });
    }, { threshold: 0.3 });
    observer.observe(container);
}

function openVideoModal(modal, modalPlayer, inlineVideo, container) {
    modalPlayer.src = inlineVideo.src;
    modal.classList.add('active');
    modalPlayer.play();
    inlineVideo.pause();
    container.classList.remove('playing');
    document.body.style.overflow = 'hidden';
}

function closeVideoModal(modal, modalPlayer) {
    modal.classList.remove('active');
    modalPlayer.pause();
    modalPlayer.currentTime = 0;
    document.body.style.overflow = '';
}

function setupModalCloseEvents(modal, modalPlayer) {
    document.getElementById('videoModalClose').addEventListener('click', function() {
        closeVideoModal(modal, modalPlayer);
    });
    document.getElementById('videoModalOverlay').addEventListener('click', function() {
        closeVideoModal(modal, modalPlayer);
    });
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.classList.contains('active')) {
            closeVideoModal(modal, modalPlayer);
        }
    });
}

function setupVideoModal() {
    const container = document.getElementById('socialVideoContainer');
    const modal = document.getElementById('videoModal');
    const modalPlayer = document.getElementById('videoModalPlayer');
    const inlineVideo = document.getElementById('socialVideo');
    container.addEventListener('click', function() {
        openVideoModal(modal, modalPlayer, inlineVideo, container);
    });
    setupModalCloseEvents(modal, modalPlayer);
}

fetchContent();
setupVideoAutoplay();
setupVideoModal();
