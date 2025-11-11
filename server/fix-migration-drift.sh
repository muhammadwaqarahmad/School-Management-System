#!/bin/bash

echo "========================================"
echo "Fixing Prisma Migration Drift"
echo "========================================"
echo ""
echo "IMPORTANT: Make sure the server is stopped first!"
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

echo "Step 1: Resolving migration state..."
npx prisma migrate resolve --applied 20251110171556_add_historical_fields_to_fee || echo "Warning: Could not resolve first migration. Continuing..."

npx prisma migrate resolve --applied 20251111120000_add_historical_session_to_fee || echo "Warning: Could not resolve second migration. Continuing..."

echo ""
echo "Step 2: Checking migration status..."
npx prisma migrate status

echo ""
echo "Step 3: Generating Prisma Client..."
npx prisma generate

echo ""
echo "========================================"
echo "Done! You can now start your server."
echo "========================================"

