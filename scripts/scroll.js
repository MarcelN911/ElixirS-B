function removeOldLoader() {
    const oldLoader = document.getElementById('scrollLoader');
    if (oldLoader) {
        oldLoader.remove();
    }
}

function createLoader() {
    const container = document.getElementById('productsGrid');
    const loader = document.createElement('div');
    loader.id = 'scrollLoader';
    loader.className = 'loader';
    loader.innerHTML = `
        <div class="loader-spinner"></div>
        <p class="loader-text">Más productos...</p>
    `;
    container.appendChild(loader);
    return loader;
}

function onLoaderVisible(observer, loader) {
    observer.unobserve(loader);
    loader.remove();
    createProductCards(data);
    startScrollObserver();
}

function startScrollObserver() {
    removeOldLoader();

    if (showProducts >= data.length) {
        return;
    }

    const loader = createLoader();
    const observer = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) {
            onLoaderVisible(observer, loader);
        }
    });
    observer.observe(loader);
}

function animateCards() {
    const cards = document.querySelectorAll('.fade-hidden');
    const observer = new IntersectionObserver(function(entries) {
        for (let index = 0; index < entries.length; index++) {
            if (entries[index].isIntersecting) {
                entries[index].target.classList.add('fade-visible');
                observer.unobserve(entries[index].target);
            }
        }
    });
    for (let index = 0; index < cards.length; index++) {
        observer.observe(cards[index]);
    }
}
