const dbUrl = `https://docs.google.com/spreadsheets/d/1FiOCY_GIkpCCZVaZplXQtQzwLORYQOws/gviz/tq?tqx=out:json`;

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

const menuButton = document.getElementById('menuButton');
if (menuButton) {
    document.getElementById('menuButton').addEventListener('click', openMobileMenu);
    document.getElementById('menuClose').addEventListener('click', closeMobileMenu);
    document.getElementById('mobileOverlay').addEventListener('click', closeMobileMenu);
}
