const dbUrl = `https://docs.google.com/spreadsheets/d/1FiOCY_GIkpCCZVaZplXQtQzwLORYQOws/gviz/tq?tqx=out:json&gid=438421994&headers=1`;
const productsUrl = `https://docs.google.com/spreadsheets/d/1FiOCY_GIkpCCZVaZplXQtQzwLORYQOws/gviz/tq?tqx=out:json&gid=664120326#gid=664120326&headers=1`;

let data = [];

let showProducts = 0;
const productsPerLoad = 20;


function openMobileMenu() {
    document.getElementById('mobileMenu').classList.add('active');
    document.getElementById('mobileOverlay').classList.add('active');
}

function closeMobileMenu() {
    document.getElementById('mobileMenu').classList.remove('active');
    document.getElementById('mobileOverlay').classList.remove('active');
}

function createProductData(data, index) {
    const product = {
            name: data[index].c[1].v,
            brand: data[index].c[2].v,
            price: data[index].c[3].v,
            sale: ifSale(data, index),
            badge: ifBadge(data, index),
            categories: data[index].c[7].v,
            active: data[index].c[8].v,
            image: ifImage(data, index),
            description: data[index].c[10].v
        };
    return product;
}


function ifSale(data, index) {
    if (data[index].c[4]) {
        return data[index].c[4].v;
    }
    return '';
}

function ifImage(data, index) {
    if (data[index].c[9]) {
        return data[index].c[9].v;
    }
    return '';
}

function ifBadge(data, index) {
    if (data[index].c[5]) {
        return data[index].c[5].v;
    }
    return '';
}

const menuButton = document.getElementById('menuButton');
if (menuButton) {
    document.getElementById('menuButton').addEventListener('click', openMobileMenu);
    document.getElementById('menuClose').addEventListener('click', closeMobileMenu);
    document.getElementById('mobileOverlay').addEventListener('click', closeMobileMenu);
}