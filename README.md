# MediGo Frontend

React frontend for **MediGo**, a medical shop ERP for purchases, billing, batch-level inventory, supplier ledgers, expiry records, credit notes, and business insights.

The interface is optimized for fast keyboard-driven data entry, local-first operation, and clear review of every value before it is saved.

- **Frontend repository:** https://github.com/Muntazir3i/MediGo-
- **Backend repository:** https://github.com/Muntazir3i/BackEnd-For-MediGo

## Highlights

- Dashboard with stock, expiry, and business summaries
- Sales billing with invoice search, PDF output, deletion, and voiding
- Purchase entry with batch details, free quantity, salts, and bill image upload
- Inventory catalogue with batch-level editing, stock adjustment, and purchase history
- Supplier ledger with general ledger, payments, expiry ledger, and credit notes
- Supplier statement PDF generation
- Expiry register and expiry ledger
- Credit note creation and management
- Insights dashboard for purchase trends, top products, and outstanding payables
- Light and dark themes
- Command palette and keyboard shortcuts for fast workflows

## Tech stack

| Area | Technology |
| --- | --- |
| UI | React 19 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Components | Radix UI primitives and custom `shadcn/ui`-style components |
| Routing | React Router 7 |
| HTTP | Axios |
| Icons | Lucide React |
| PDF | jsPDF and jspdf-autotable |
| Command palette | cmdk |
| Linting | ESLint 9 |

## Routes

| Route | Screen |
| --- | --- |
| `/` | Dashboard |
| `/billing` | Sales billing |
| `/add` | Purchase entry, supplier, payment, expiry, and credit note tabs |
| `/inventory` | Medicine catalogue and purchase history |
| `/ledger` | General ledger, payments, expiry ledger, and credit notes |
| `/insights` | Business insights |

## Project structure

```text
MediGo/
├── src/
│   ├── Components/
│   │   ├── Tabs/             # Add, inventory, ledger and credit-note tab content
│   │   ├── ui/               # Shared UI primitives
│   │   ├── Add.jsx
│   │   ├── BillImageUpload.jsx
│   │   ├── CommandPalette.jsx
│   │   ├── DashBoard.jsx
│   │   ├── EditPurchaseBillDialog.jsx
│   │   ├── Home.jsx
│   │   ├── Insights.jsx
│   │   ├── Inventory.jsx
│   │   ├── Ledger.jsx
│   │   ├── LedgerSupplierList.jsx
│   │   ├── SaltEditor.jsx
│   │   ├── Sidebar.jsx
│   │   └── TableData.jsx
│   ├── context/              # Theme context
│   ├── hooks/                # Supplier, payment, bill and search hooks
│   ├── services/             # API service layer
│   ├── utils/                # PDF, billing, expiry and formatting helpers
│   ├── Layout.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── eslint.config.js
├── components.json
├── jsconfig.json
├── public/
└── package.json
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- The MediGo backend running on `http://localhost:8008`

### Install

```bash
git clone https://github.com/Muntazir3i/MediGo-.git
cd MediGo-
npm install
```

### Start the frontend

```bash
npm run dev
```

Vite starts on:

```text
http://localhost:5173
```

The dev server proxies `/api` requests to:

```text
http://localhost:8008
```

This proxy is configured in `vite.config.js`.

## Backend connection

The current service layer uses `http://localhost:8008` directly in:

```text
src/services/medicineService.js
```

If you change the backend port, update both:

- `vite.config.js` — Vite proxy target
- `src/services/medicineService.js` — API base URLs

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

There is currently no automated test suite configured.

## Key workflows

### Supplier bill image upload

On the **Add** page, the **Import a bill image** card accepts a JPG, PNG, or WebP image up to 8 MB.

- The image is sent to `POST /api/bills/extract`.
- The backend uses Google Gemini to extract the supplier bill.
- Returned invoice, date, supplier, and product fields prefill the purchase form.
- Every value must be reviewed before saving.
- The backend must have `GEMINI_API_KEY` configured and needs an internet connection.

The extracted product fields include:

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

### Purchase entry

- Add medicine lines with batch, expiry, quantity, free quantity, MRP, rate, discount, and GST.
- Free quantity is optional and defaults to `0`; free units are added to stock but not charged.
- Salt composition can be attached to the medicine.
- Purchase bills can be edited later; stock changes are applied as audited deltas.
- Purchase bills can be voided only while all received units remain in stock.

### Inventory

- Browse batch-level medicine stock.
- Edit medicine and batch metadata, including supplier and bill number.
- Use **Adjust stock** for audited quantity changes.
- Review low-stock, out-of-stock, and expiring medicines.
- Open purchase history and edit or void purchase bills.

### Ledger

- General ledger with supplier search and transaction history.
- Date-filtered payments.
- Expiry ledger by supplier.
- Credit notes by supplier.
- Supplier statement PDF generation.

### Insights

- Purchase trends and monthly summaries.
- Medicine order lookup with order count, total quantity, average rate and total purchase value.
- Medicine price history with a searchable chart of GST-inclusive unit price versus MRP over time.
- Top products and supplier activity.
- Outstanding payables and business metrics.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + K` | Open the command palette |
| `Alt + ↑ / ↓` | Move between product rows |
| `Alt + ← / →` | Move between product fields |
| `Ctrl/Cmd + Enter` | Add a product line |
| `Ctrl/Cmd + Shift + A` | Add a product line |
| `Ctrl/Cmd + Shift + Backspace` | Delete the focused product line |
| `Ctrl/Cmd + Shift + S` | Save the purchase bill |

## Theming

The app supports light and dark themes through a theme context and a toggle in the sidebar/header. Dark-mode compatibility styles are defined in `src/index.css`.

## Build and deployment

Create a production build:

```bash
npm run build
```

The output is written to `dist/`.

To deploy:

1. Serve `dist/` from a static web server.
2. Configure SPA fallback to `index.html`.
3. Ensure the backend is reachable at the expected URL, or update the API base URLs and proxy configuration for your environment.

## Troubleshooting

**The frontend loads but API calls fail**

- Confirm the backend is running on port `8008`.
- Check the Vite proxy target in `vite.config.js`.
- Check the API base URLs in `src/services/medicineService.js`.

**Bill image extraction fails**

- Confirm `GEMINI_API_KEY` is set in the backend `.env`.
- Confirm the backend has internet access.
- Use a JPG, PNG, or WebP image under 8 MB.

**Dark-mode text is hard to read**

- Verify the root `.dark` class is present.
- Keep using semantic colors or the existing dark-mode compatibility classes in `src/index.css`.

## Contributing

1. Create a feature branch from `main`.
2. Keep components consistent with the existing structure and styling.
3. Run `npm run lint` and `npm run build` before opening a pull request.
4. Describe the user-facing change and any backend requirements.

## License

MIT

## Author

**Mohammad Muntazir** — MDOT / algoNdev (AND Academy)
