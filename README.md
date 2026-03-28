# OpenCare Hospital App

This project is split cleanly into:

- `frontend/` for the patient and admin UI
- `backend/` for API routes, admin auth, Supabase writes, and Gemini transcription
- `supabase/` for schema and seed SQL

## Included features

- Smart queue and token generation like `OPD-047`
- Live queue position and estimated wait time
- Realtime queue, medicine, and bed updates through Supabase subscriptions
- Medicine search with stock colors and alternatives
- Bed and ward management with admin actions
- Admin login for staff actions
- Responsive patient portal for mobile and web
- Gemini image transcription endpoint for prescription photos

## Setup

1. Copy [backend/.env.example](/Users/abhishekmeena/Downloads/Document/CodeLab/opencare/backend/.env.example) to `backend/.env`.
2. Copy [frontend/.env.example](/Users/abhishekmeena/Downloads/Document/CodeLab/opencare/frontend/.env.example) to `frontend/.env`.
3. Run [supabase/schema.sql](/Users/abhishekmeena/Downloads/Document/CodeLab/opencare/supabase/schema.sql) in Supabase SQL editor.
4. Run [supabase/seed.sql](/Users/abhishekmeena/Downloads/Document/CodeLab/opencare/supabase/seed.sql) for demo medicine and bed data.
5. Start backend with `cd backend && npm install && npm run dev`.
6. Start frontend with `cd frontend && npm install && npm run dev`.

Default local URLs:

- frontend: `http://localhost:5173`
- backend: `http://localhost:4000`

Default demo admin credentials come from `backend/.env`:

- email: `admin@opencare.local`
- password: `ChangeThis123`
