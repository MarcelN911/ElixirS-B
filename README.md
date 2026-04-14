<div align="center">

# 🌸 ElixirS-B
### Online Perfume Shop — Built for a Small Business in Colombia

*Replacing a static PDF catalog with a dynamic, WhatsApp-integrated shopping experience*

<br/>

[![Live Demo](#)
&nbsp;
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Google Drive API](https://img.shields.io/badge/Google%20Drive%20API-4285F4?style=for-the-badge&logo=google-drive&logoColor=white)](https://developers.google.com/drive)

</div>

---

## 📖 Background

A friend of mine runs a small perfume shop in Colombia. Her entire catalog lived in a PDF, and she relied solely on Instagram to reach customers. Orders were handled manually via DMs — slow and error-prone.

I built her a real online storefront: a dynamic product catalog with filtering, size selection, and a checkout flow tailored to how business is actually done in Colombia — **entirely through WhatsApp**.

---

## ✨ Features

<table>
<tr>
<td width="50%">

**🏠 Home Page**
- Bestseller section
- Embedded Instagram videos
- Customer reviews (loaded dynamically)

**🛍️ Product Catalog**
- Filter by: All / Men / Women
- Search functionality
- Product detail page with size selection (30ml, 50ml, 100ml)

</td>
<td width="50%">

**💬 WhatsApp Checkout**
- Cart → Order form → WhatsApp redirect
- Pre-filled message with products & customer info
- No data stored — privacy by design

**🤝 Perfume Advisor**
- Customer describes preferences
- Generates a structured WhatsApp message
- Seller finds the perfect match

</td>
</tr>
</table>

---

## 💬 How the WhatsApp Checkout Works

```
Customer adds products to cart
         │
         ▼
  Fills short order form
  (name, address informations and phone — never stored)
         │
         ▼
  Redirected to WhatsApp
  with pre-filled message:
  ┌──────────────────────────────┐
  │ 🛒 Order from ElixirS        │
  │ ─────────────────────────    │
  │ • Blue de Chanel 50ml — $X   │
  │ • Dior Sauvage 100ml — $X    │
  │ ─────────────────────────    │
  │ Total: $X                    │
  │ Name: Juan Garcí             │
  │ Address: Calle XY            │
  │ Phone: +57 ...               │
  └──────────────────────────────┘
         │
         ▼
   Customer hits Send ✅
```

---

## 📡 Data Architecture

Products and reviews are managed in **Google Sheets** — acting as a lightweight CMS, no technical knowledge required for the shop owner.

```
Google Sheets (Drive)
       │
  fetch() + Drive API
       │
  JSON parsing
       │
  Dynamic DOM rendering
  (Products · Bestsellers · Reviews)
```

The owner updates her catalog by editing a spreadsheet — zero code changes needed.

---

## 🚀 Getting Started

No build tools or dependencies — pure HTML, CSS and JavaScript.

```bash
git clone https://github.com/marceln911/ElixirS-B.git
cd ElixirS-B
open index.html
```

To connect your own data source, update the Sheet ID and API credentials in `js/data.js`.

---

## 💡 What I Learned

- Using **Google Sheets as a no-code CMS** via the Drive API — keeping the solution accessible for a non-technical client
- Designing a **WhatsApp deep-link checkout** tailored to a specific market and user behaviour
- Building a **dynamic product catalog** with filtering, search, and size variants in vanilla JS
- Applying **Mobile-First responsive design** throughout, since the target audience browses on smartphones
- Translating **real client requirements** into working product features end-to-end

---

## 🔮 Possible Future Improvements

- [ ] Migrate data layer to a proper backend (Node.js + PostgreSQL)
- [ ] Product image gallery / zoom
- [ ] Order history stored locally (localStorage)
- [ ] Admin panel for inventory management

---

<div align="center">

**Marcel N.** — Electronics Technician & Fullstack Developer in Training

[![GitHub](https://img.shields.io/badge/GitHub-marceln911-181717?style=flat-square&logo=github)](https://github.com/marceln911)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-marceln911-0A66C2?style=flat-square&logo=linkedin)](https://linkedin.com/in/marceln911)

*Built with ❤️ for a small business in Colombia*

</div>
