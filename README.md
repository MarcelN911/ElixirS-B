# 🌸 Fragrance Shop — Online Perfume Catalog

> A mobile-first online shop built for a small perfume business in Colombia — replacing a static PDF catalog with a dynamic, WhatsApp-integrated shopping experience.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Google Drive API](https://img.shields.io/badge/Google%20Drive%20API-4285F4?style=flat-square&logo=google-drive&logoColor=white)
![Mobile First](https://img.shields.io/badge/Mobile--First-Responsive-brightgreen?style=flat-square)

---

## 📖 Background

A friend of mine runs a small perfume shop in Colombia. Her entire catalog lived in a PDF file, and she relied solely on Instagram to reach customers. Orders were handled manually through direct messages — a slow, error-prone process.

I built her a real online storefront: a dynamic catalog with product filtering, size selection, and a checkout flow tailored to how business is actually done in Colombia — **entirely through WhatsApp**.

---

## ✨ Features

### 🏠 Home Page
- **Bestseller section** showcasing top products
- **Embedded Instagram videos** to reflect her social media presence
- **Customer reviews** loaded dynamically from Google Drive

### 🛍️ Product Catalog
- Full product listing with images, names, and prices
- **3-button filter**: All / Men / Women
- Click any product to open a **dedicated product detail page**
- Size selection per product (e.g. 30ml, 50ml, 100ml) with individual pricing

### 💬 WhatsApp Checkout Flow
No traditional payment gateway — instead, a checkout experience designed for the Colombian market:
1. Customer adds products to cart
2. Clicks **"Order"** in the cart
3. Fills in a short contact form (name, phone number — **data is never stored**)
4. Gets **automatically redirected to WhatsApp** with a pre-filled message containing:
   - Selected products, sizes and quantities
   - Total price
   - Customer contact details
5. Customer simply hits **Send** — the seller receives a clean, structured order

### 🤝 Perfume Advisor Page
A dedicated page where customers describe their preferences (occasion, scent type, mood) — generates a structured WhatsApp message so the seller can recommend the perfect fragrance.

### 📄 Additional Pages
- **About Us** — brand story and values
- **Contact** — WhatsApp-linked contact form
- **Privacy Policy** — GDPR-aligned data handling notice

---

## 🔧 Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Semantic page structure |
| CSS3 | Responsive styling, Mobile-First layout |
| Vanilla JavaScript (ES6+) | DOM manipulation, API calls, cart logic |
| Google Drive API | Product data & reviews as live JSON source |
| Fetch API | Async data loading from Google Drive |
| WhatsApp API | Deep-link generation for pre-filled messages |

---

## 📡 Data Architecture

All product and review data is managed through **Google Sheets / Google Drive**, which acts as a lightweight CMS — perfect for a small business owner with no technical background.

```
Google Drive (Sheets)
       │
       ▼
  fetch() call
       │
       ▼
  JSON parsing
       │
       ▼
Dynamic DOM rendering
(Products, Bestsellers, Reviews)
```

This means the shop owner can update products, prices, and reviews simply by editing a spreadsheet — no code changes required.

---

## 📱 Mobile-First Design

The entire UI was designed and built **mobile-first**, since the target audience primarily browses on smartphones. Breakpoints scale up for tablet and desktop views, but the core experience is optimized for mobile — especially the WhatsApp ordering flow.

---

## 🚀 Getting Started

No build tools or dependencies required — this is pure HTML, CSS and JavaScript.

```bash
# Clone the repository
git clone https://github.com/marceln911/fragrance-shop.git

# Open in browser
cd fragrance-shop
open index.html
```

To connect your own Google Drive data source, update the API credentials and Sheet ID in `js/data.js`.

---

## 💡 What I Learned

- Integrating **Google Drive / Sheets as a no-code backend** via the Google Drive API
- Designing and implementing a **WhatsApp deep-link checkout** flow tailored to a specific market
- Building a **dynamic product catalog** with filtering and size variants using only vanilla JS
- Applying **Mobile-First responsive design** principles throughout
- Handling **real user requirements** from a non-technical client and translating them into working features

---

## 🔮 Possible Future Improvements

- [ ] Migrate data layer to a proper backend (Node.js + PostgreSQL)
- [ ] Add search functionality
- [ ] Product image gallery / zoom
- [ ] WhatsApp Business API integration for automated order confirmation
- [ ] Admin panel for inventory management

---

## 📬 Contact

**Marcel N.** — Electronics Technician & Fullstack Developer in Training  
[GitHub](https://github.com/marceln911) · [LinkedIn](https://linkedin.com/in/marceln911)

---

*Built with ❤️ for a small business in Colombia.*
