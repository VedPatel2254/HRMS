#!/bin/bash
# PRSECURITY HRMS - Deployment Script for Hostinger VPS
# Run this script on your Hostinger VPS after uploading the project

set -e

echo "========================================="
echo "  PRSECURITY HRMS - Deployment"
echo "========================================="

# 1. Install Node.js 18+ if not present
echo "[1/10] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "Node.js: $(node -v)"

# 2. Install PM2 globally
echo "[2/10] Installing PM2..."
sudo npm install -g pm2

# 3. Install dependencies
echo "[3/10] Installing backend dependencies..."
cd backend
npm install --production

# 4. Generate Prisma client
echo "[4/10] Generating Prisma client..."
npx prisma generate

# 5. Setup database
echo "[5/10] Setting up database..."
echo "Run this manually: npx prisma migrate deploy"
echo "Or push schema: npx prisma db push"

# 6. Seed database
echo "[6/10] Seeding database..."
echo "Run this manually: npx ts-node prisma/seed.ts"

# 7. Build frontend (should already be built)
echo "[7/10] Checking frontend build..."
if [ ! -d "../frontend/dist" ]; then
    echo "Building frontend..."
    cd ../frontend
    npm install
    npx vite build
    cd ../backend
fi

# 8. Create uploads directory
echo "[8/10] Creating uploads directory..."
mkdir -p uploads

# 9. Setup PM2
echo "[9/10] Starting with PM2..."
cd ..
pm2 delete prsecurity-hrms 2>/dev/null || true
pm2 start backend/dist/app.js --name prsecurity-hrms --max-memory-restart 512M

# 10. Save PM2 and setup startup
echo "[10/10] Saving PM2 config..."
pm2 save
pm2 startup

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "Your app is running on port 5000"
echo "Access: http://your-server-ip:5000"
echo ""
echo "Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart app"
echo "  pm2 stop all        - Stop app"
