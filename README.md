## farm-to-door-backend

### Setup

- **Install deps**:
  - `npm install`
- **Create env file**:
  - `cp env.example .env.local` (preferred) or `cp env.example .env`
  - Update env values (at minimum `MONGODB_URI` and `JWT_SECRET`)
- **Start**:
  - `npm start`
  - Dev mode (auto-reload): `npm run dev`

### Tests

- **Install dev deps**: `npm install`
- **Run tests**: `npm test`

### Required environment variables

- **MONGODB_URI**: MongoDB connection string (local or Atlas).
- **JWT_SECRET**: Secret used to sign/verify JWTs.
- **PORT** (optional): Defaults to `8080`.
- **SEED_PRODUCTS** (optional): Set to `true` to seed products on startup (overwrites products).

### Troubleshooting

- If you see **"Missing required environment variable: MONGODB_URI"**, you haven’t created `.env` (or it’s not being loaded).
- If you set `MONGODB_URI` but still can’t connect, make sure MongoDB is running (local) or your Atlas network/IP allowlist is configured.

### Security note

- Passwords are now stored as **bcrypt hashes** (legacy plaintext users are migrated on next login).


