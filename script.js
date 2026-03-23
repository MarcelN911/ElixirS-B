const dbUrl = `https://docs.google.com/spreadsheets/d/1FiOCY_GIkpCCZVaZplXQtQzwLORYQOws/gviz/tq?tqx=out:json`;

let data = [];

async function fetchProducts() {
    const db = await fetch(dbUrl);
    const content = await db.text();

    json = JSON.parse(content.substring(47).slice(0, -2));
    data = json.table.rows;
    createProductCards(data);
}
fetchProducts();

function createProductCards(data) {
    for (let index = 0; index < data.length; index++) {
        const product = {
            name: data[index].c[1].v,
            brand: data[index].c[2].v,
            price: data[index].c[3].v,
            sale: ifSale(data, index),
            image: ifImage(data, index),
            description: data[index].c[6].v,
            badge: ifBadge(data, index),
            categories: data[index].c[8].v,
            active: data[index].c[9].v
        };
        createProductTemplate(product);
    }
}

function ifSale(data, index) {
    if (data[index].c[4]) {
        return data[index].c[4].v;
    }
    return '';
}

function ifImage(data, index) {
    if (data[index].c[5]) {
        return data[index].c[5].v;
    }
    return '';
}

function ifBadge(data, index) {
    if (data[index].c[7]) {
        return data[index].c[7].v;
    }
    return '';
}

function filterProducts(category) {
    const container = document.getElementById('productsGrid');
    container.innerHTML = '';

    if (category === 'Todos') {
        createProductCards(data);
    } else {
        for (let index = 0; index < data.length; index++) {
            if (data[index].c[8].v === category) {
                const product = {
                    name: data[index].c[1].v,
                    brand: data[index].c[2].v,
                    price: data[index].c[3].v,
                    sale: ifSale(data, index),
                    image: ifImage(data, index),
                    description: data[index].c[6].v,
                    badge: ifBadge(data, index),
                    categories: data[index].c[8].v,
                    active: data[index].c[9].v
                };
                createProductTemplate(product);
            }
        }
    }
}
