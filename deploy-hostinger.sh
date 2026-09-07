#!/bin/bash
# PRSECURITY HRMS - Hostinger Shared Hosting Deployment Script
# Run this via Hostinger's Node.js terminal or SSH

set -e

echo "========================================="
echo "  PRSECURITY HRMS - Hostinger Deployment"
echo "========================================="

# 1. Install dependencies
echo "[1/6] Installing backend dependencies..."
cd backend
npm install --production

# 2. Generate Prisma client
echo "[2/6] Generating Prisma client..."
npx prisma generate

# 3. Push schema to MySQL database
echo "[3/6] Pushing schema to MySQL..."
npx prisma db push

# 4. Seed database
echo "[4/6] Seeding database..."
npx ts-node prisma/seed.ts

# 5. Create uploads directory
echo "[5/6] Creating uploads directory..."
mkdir -p uploads

# 6. Start app
echo "[6/6] Starting application..."
cd ..
pm2 start backend/dist/app.js --name prsecurity-hrms --max-memory-restart 512M
pm2 save

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "Your app is running!"
echo "Check Hostinger hPanel → Node.js for your URL"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart app"
