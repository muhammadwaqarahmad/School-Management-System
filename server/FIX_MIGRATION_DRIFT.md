# Fix Migration Drift Issue

## Problem
- Migration `20251110171556_add_historical_fields_to_fee` was modified after being applied
- Database already has `historicalSession` column (from `db push`)
- Migration history is out of sync with database state
- Prisma Client generation fails due to file lock (server running)

## Solution Steps

### Step 1: Stop the Server
**IMPORTANT**: Stop any running Node.js server processes that are using Prisma Client.
```bash
# Find and stop the server process
# Press Ctrl+C in the terminal where the server is running
# Or close the terminal/IDE that's running the server
```

### Step 2: Resolve Migration Drift

Since `db push` confirmed the database is already in sync, we need to mark the migrations as applied:

```bash
cd server

# Option A: Mark the new migration as applied (if it exists in database)
npx prisma migrate resolve --applied 20251111120000_add_historical_session_to_fee

# Option B: If that doesn't work, reset migration state (ONLY if you're okay with losing migration history tracking)
# This will mark all migrations as applied based on current database state
npx prisma migrate resolve --applied 20251110171556_add_historical_fields_to_fee
npx prisma migrate resolve --applied 20251111120000_add_historical_session_to_fee
```

### Step 3: Verify Migration Status
```bash
npx prisma migrate status
```

### Step 4: Generate Prisma Client
```bash
npx prisma generate
```

### Step 5: Restart Server
```bash
npm start
# or
node src/server.js
```

## Alternative: Reset Migrations (Development Only)

If you're in development and don't mind resetting migration history:

```bash
cd server

# 1. Stop the server first!

# 2. Reset migrations (this will mark all migrations as applied based on current schema)
npx prisma migrate resolve --applied 20251110171556_add_historical_fields_to_fee
npx prisma migrate resolve --applied 20251111120000_add_historical_session_to_fee

# 3. Generate client
npx prisma generate

# 4. Start server
npm start
```

## Why This Happened

1. The migration file was modified after being applied to the database
2. `db push` was used which applies schema changes without tracking migrations
3. The database state and migration history became out of sync

## Prevention

- Don't modify migration files after they've been applied
- Use `prisma migrate dev` instead of `db push` for tracked migrations
- Use `db push` only for rapid prototyping in development

