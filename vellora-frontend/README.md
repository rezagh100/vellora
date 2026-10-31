# Vellora Frontend

React + Vite frontend prototype for Vellora private and group messaging.

## Run locally

```bash
npm install
npm run dev
```

Set the backend URLs in `.env` if needed:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_BASE_URL=ws://localhost:8000
```

## Connected backend APIs

The current Django project includes and this frontend calls:

- `POST /api/auth/otp/request/` — request an OTP using `{ "phone_number": "09..." }`
- `POST /api/auth/otp/verify/` — verify using `{ "phone_number": "09...", "code": "123456" }`
- `POST /api/refresh/` — refresh using `{ "refresh": "..." }`

Tokens and user data are kept in `sessionStorage` for this prototype and cleared on sign out.

## Chat API status

The current backend archive does **not** yet implement REST endpoints for listing conversations, loading messages, creating private/group conversations, or sending messages. The `chatApi` client methods are prepared in `src/api.js`, but are deliberately not called until matching Django routes and response serializers exist.

The visible chat list and messages are demo data. WebSocket URL helper is included, but live chat is not connected end-to-end.

## Notes

- Configure Django CORS to allow the Vite origin (usually `http://localhost:5173`) during local development.
- Use HTTPS/WSS and a safer token transport strategy for production. Avoid long-lived access tokens.
- Do not expose secrets in frontend environment variables.
