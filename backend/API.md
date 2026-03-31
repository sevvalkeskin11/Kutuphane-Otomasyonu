# Backend API (MVP)

Bu dosya frontend ekibinin mock verileri API ile degistirmesi icin hizli referanstir.

## Base URL
- Local: `http://localhost:5050`
- Tum endpointler `application/json` doner.

## Health
- `GET /api/health`

## Auth
- `POST /api/auth/register`
  - body: `{ "fullName": "...", "email": "...", "password": "..." }`
  - response: `{ token, user }`
- `POST /api/auth/login`
  - body: `{ "email": "...", "password": "..." }`
  - response: `{ token, user }`
- `GET /api/auth/me`
  - header: `Authorization: Bearer <token>`

## Books
- `GET /api/kitaplar?limit=50&offset=0`
- `GET /api/kitaplar/ara?q=anar&limit=40`
- `GET /api/kitaplar/:isbn`
- `GET /api/kitaplar/:isbn/stok`
  - response: `{ isbn, inStock, copies }`

## Cover
- `GET /api/kapak/lookup?isbn=978...&baslik=...&yazar=...`
- `GET /api/kapak/:isbn`

## Borrow (User)
- `POST /api/odunc`
  - body: `{ "kitapIsbn": "978...", "userId": 1 }`
  - opsiyonel: `dueDate` (`YYYY-MM-DD`)
  - response:
    - `{ message, transaction, stock }`

## Admin (Token + admin role zorunlu)
- `GET /api/admin/dashboard`
  - response:
    - `{ totalBooks, activeBorrows, overdue, weekData }`
- `GET /api/admin/users?q=&limit=100&offset=0`
  - response satiri:
    - `{ id, name, email, status, joined, role }`
- `PATCH /api/admin/users/:id/status`
  - body (opsiyonel): `{ "status": "active" }` veya `{ "isActive": true }`
  - body yoksa toggle yapar.
- `POST /api/admin/users/:id/reset-password`
  - response: `{ message, email, temporaryPassword }`
- `GET /api/admin/transactions?status=active|borrowed|overdue|returned|all&limit=200`
  - response satiri:
    - `{ id, userId, userName, bookIsbn, bookTitle, borrowDate, dueDate, returnDate, status, rawStatus }`
- `POST /api/admin/transactions/:id/return`
  - response: `{ message, transaction, stock }`

## Frontend mock alanlari ile eslesme
- `mockDashboardStats` -> `GET /api/admin/dashboard`
- `mockUsers` -> `GET /api/admin/users`
- `mockTransactions` -> `GET /api/admin/transactions?status=active`
- `toggleStatus` -> `PATCH /api/admin/users/:id/status`
- `markReturned` -> `POST /api/admin/transactions/:id/return`
- `getStockForBook` -> `GET /api/kitaplar/:isbn/stok`
- `simulateBorrow` -> `POST /api/odunc`
