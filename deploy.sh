#!/bin/bash
# HOSCORE Production Deploy Automation Script

echo "============================================="
echo "🚀 Starting HOSCORE Production Deployment..."
echo "============================================="

# Exit immediately if a command exits with a non-zero status
set -e

# 1. Install dependencies
echo "📦 Installing backend server dependencies..."
npm install --prefix server --production=false

echo "📦 Installing frontend client dependencies..."
npm install --prefix client --production=false

# 2. Run Database Migrations
echo "🗄️ Running Prisma database migrations..."
npx prisma migrate deploy --schema server/prisma/schema.prisma

# 3. Compile backend server
echo "🛠️ Compiling server code (TypeScript)..."
npm run build --prefix server

# 4. Compile frontend production bundle
echo "🛠️ Building client assets (Vite)..."
npm run build --prefix client

echo "============================================="
echo "✅ HOSCORE Production Deploy Steps Completed Successfully!"
echo "============================================="
