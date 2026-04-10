#!/bin/bash
set -e

echo ""
echo "═══════════════════════════════════════════════════"
echo "  🏛️  OFF-GRID DAO — Quick Start Setup"
echo "═══════════════════════════════════════════════════"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi
echo "✅ npm found: $(npm --version)"

echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✅ Backend dependencies installed"

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ Setup Complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "📖 Next Steps:"
echo ""
echo "  1. Open Terminal 1 and run:"
echo "     cd backend && npx hardhat node"
echo ""
echo "  2. Open Terminal 2 and run:"
echo "     cd backend && npm run deploy"
echo ""
echo "  3. Open Terminal 3 and run:"
echo "     cd backend && npm start"
echo ""
echo "  4. Open Terminal 4 and run:"
echo "     cd frontend && npm run dev"
echo ""
echo "  5. Open browser:"
echo "     http://localhost:5173"
echo ""
echo "📚 For detailed setup, see: SETUP_GUIDE.md"
echo ""
