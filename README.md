# MediGo – Frontend
A modern, clean, and fast **medical shop ERP frontend** built with **React**, **shadcn/ui**, and **Tailwind CSS**. This is the UI layer for the MediGo ERP system, which handles **billing, inventory, payments, ledgers**, and day-to-day management for medical shops.

## 🚀 Tech Stack
- **React (Vite)** – Fast, modular frontend architecture
- **Tailwind CSS** – Utility-first styling
- **shadcn/ui** – Accessible, elegant UI components
- **React Router** – Client-side navigation
- **Axios** – API communication with backend
- **State Management** – (Zustand / Redux / Context depending on your setup)

## 📦 Features
- **Billing system** – Add bills, line items, taxes, discounts
- **Payments tracking** – Add payments, pending amounts, balance tracking
- **Inventory management** – Add/update medicines, stock tracking
- **Customer & vendor management**
- **Supplier bill image upload** – choose a printed bill photo and prefill the purchase form via Gemini
- **Dashboard with stats**
- **Responsive UI** using Tailwind + shadcn/ui
- Smooth UX with modals, forms, and tables
- **Offline-ready UI** if backend runs on SQLite locally

## 🗂️ Project Structure
```
mediGo-frontend/
│── src/
│   ├── components/     # Reusable UI components (shadcn/ui + custom)
│   ├── pages/          # Route screens
│   ├── hooks/          # Custom hooks (API, state, logic)
│   ├── lib/            # Utilities, helpers
│   ├── services/       # API calls (axios)
│   ├── context/        # App context or state (if used)
│   └── App.jsx
│── public/
│── index.html
│── tailwind.config.js
│── package.json
```

## 🛠️ Installation & Setup
### 1. Clone the repository
```bash
git clone https://github.com/yourusername/mediGo-frontend.git
cd mediGo-frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

## 🔗 Environment Variables
The frontend talks to the backend at `http://localhost:8008`. The Vite dev server proxies `/api` requests to that backend (see `vite.config.js`).

If you use an environment variable, create a `.env` file in the project root:
```
VITE_API_URL=http://localhost:8008
```
Make sure this matches your backend server URL.

## 📡 API Integration
This frontend interacts with the MediGo backend. All API calls are stored in:
```
src/services/
```
Example:
```js
axios.get(`${import.meta.env.VITE_API_URL}/inventory`);
```

## 🧾 Bill Image Upload

On the **Add** page, the **Import a bill image** card lets you upload a supplier bill.

- Accepted formats: JPG, PNG, WebP
- Maximum file size: 8 MB
- The image is sent to `POST /api/bills/extract` on the backend.
- The backend uses the **Gemini API** to extract the invoice number, bill date, supplier details, and product line items.
- The returned values prefill the purchase form, and every value must be reviewed before saving.
- This feature requires the backend to have `GEMINI_API_KEY` configured and needs an internet connection.

The upload component is implemented in:
```
src/Components/BillImageUpload.jsx
```

The extracted product fields are:

```json
{
  "name": "",
  "batchNumber": "",
  "expiryDate": "",
  "stock": 0,
  "free": 0,
  "unitPrice": 0,
  "mrp": 0,
  "discount": 0,
  "gstPercentage": 0
}
```

## 🧩 UI Components (shadcn/ui)
Generate components using:
```bash
npx shadcn-ui add button card dialog input table
```
Common components used:
- Buttons
- Cards
- Dialogs (modals)
- Forms
- Tables
- Toast notifications


## 🤝 Contributing
1. Fork the project
2. Create a feature branch
3. Commit changes
4. Open a pull request

## 📄 License
Licensed under the **MIT License**.

## 🧑‍💻 Author
**MDOT** – Algorithm & Development Academy (algoNdev (AND))
