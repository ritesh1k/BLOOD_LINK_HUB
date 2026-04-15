# Blood Donation & Receiving – Full Stack Upgrade (Express + MySQL)

This package upgrades your existing frontend-only site into a full-stack app.

## Structure
```
workspace_blood_app/
  backend/               # Express API
  database/              # MySQL schema
  ... (your existing frontend files)
```

## Quick Start

1) **Import Database**
- Open MySQL client or Workbench and run `database/schema.sql`

2) **Configure Backend**
```bash
cd backend
cp .env.example .env
# edit .env with your MySQL credentials
npm install
npm run dev
```
- API will run on `http://localhost:$3000` by default.

3) **Use from Frontend**
- The script `api.js` has been added (remember to include it in your HTML).
- Example usage:
  ```html
  <script src="api.js"></script>
  <script>
    // Register example
    registerUser({name:'Test', email:'t@t.com', password:'secret123', blood_group:'O+'})
      .then(console.log).catch(console.error);
  </script>
  ```

## API Endpoints
- `POST /api/auth/register` – name, email, password, blood_group
- `POST /api/auth/login` – email, password → returns JWT token
- `GET  /api/donors?blood_group=O+` – list donors
- `POST /api/donors/availability` (auth) – city, contact
- `POST /api/requests` (auth) – blood_group, quantity
- `GET  /api/requests/my` (auth) – list my requests

## Notes
- Passwords are hashed with **bcrypt**.
- Uses **JWT** for auth (store token in `localStorage`).
- Enable CORS for local development.
- Secure `.env` and never commit your real secrets.
