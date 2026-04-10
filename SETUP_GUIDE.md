# 🏛️ OFF-GRID DAO — Full-Stack Blockchain DApp Setup Guide

A decentralized autonomous organization (DAO) application with **zero mock data**. Everything runs on a local Hardhat blockchain with real smart contracts, voting, treasury management, and NFC integration.

---

## 📋 Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Hardhat** (installed via project)
- **MetaMask** browser extension
- **Local Terminal** access (at least 4 terminals for concurrent services)

---

## 🚀 Phase 1: Initial Setup

### 1.1 Install Backend Dependencies

```bash
cd backend
npm install
```

### 1.2 Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 1.3 Verify Hardhat Configuration

Ensure `backend/hardhat.config.cjs` has correct network settings:

```javascript
networks: {
  localhost: {
    url: "http://127.0.0.1:8545",
  }
}
```

---

## 🔗 Phase 2: Start Hardhat Local Node

**Terminal 1:** Start the local blockchain

```bash
cd backend
npx hardhat node
```

You'll see output like:

```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts:
Account #0: 0x8ba1f109551bd432803012645ac136ddd64dba72 (10000 ETH)
Account #1: 0x71c7656ec7ab88b098defb751b7401b5f6d8976f (10000 ETH)
Account #2: 0xfe3b557e8fb62b89f4b666542121c5c21d544566 (10000 ETH)
...
```

**Keep this terminal running** — it's your blockchain!

---

## 📦 Phase 3: Deploy Smart Contracts

**Terminal 2:** Deploy DAO and SimpleWallet contracts

```bash
cd backend
npm run deploy
```

Expected output:

```
📦 Loading artifacts...
📦 Deploying contracts with account: 0x8ba1f109...
  ✅ SimpleWallet deployed at: 0x5FbDB2315678afccb33f7461f5738b1d29e79...
  ✅ DAO deployed at: 0x9fE46736679d2D9a88F...
📄 Artifacts saved
📋 Deployment info saved
```

The artifacts are automatically saved to `backend/artifacts/`:
- `simpleWallet.json`
- `dao.json`
- `deployment.json` (contains addresses and deployment timestamp)

---

## 🌐 Phase 4: Start Backend Server

**Terminal 3:** Start the Express.js backend

```bash
cd backend
npm start
```

Expected output:

```
═══════════════════════════════════════════════
   🏛️  OFF-GRID DAO — Blockchain-Powered
═══════════════════════════════════════════════
   API Base:    http://localhost:5000/api
   Proposals:   http://localhost:5000/api/proposals
   Treasury:    http://localhost:5000/api/treasury
   Health:      http://localhost:5000/health
   Dashboard:   http://localhost:5000
═══════════════════════════════════════════════
   Ready for blockchain interactions...
```

Test health endpoint:

```bash
curl http://localhost:5000/health
```

---

## ⚛️ Phase 5: Start Frontend (Vite)

**Terminal 4:** Start the React frontend

```bash
cd frontend
npm run dev
```

Expected output:

```
VITE v8.0.4  ready in 120 ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

---

## 🔌 Phase 6: Connect MetaMask to Local Blockchain

1. **Open MetaMask** extension
2. **Add Local Network:**
   - Click **Settings → Networks → Add a network manually**
   - **Network Name:** `Hardhat Local`
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
   - Click **Save**

3. **Import Accounts** (use accounts from Hardhat node output):
   - Copy account #0 private key
   - Click **Account Icon → Import Account**
   - Paste private key and click **Import**
   - Repeat for accounts #1, #2 if needed

4. **Verify Connection:**
   - You should see ~10000 ETH balance
   - Network dropdown shows "Hardhat Local"

---

## 🎮 Phase 7: Test the DApp

### Create a Proposal

```bash
curl -X POST http://localhost:5000/api/proposals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Community Park Renovation",
    "description": "Renovate the local park with new facilities",
    "fundsRequested": "5"
  }'
```

Response:

```json
{
  "success": true,
  "message": "Proposal created successfully",
  "data": {
    "transactionHash": "0x1234...",
    "blockNumber": 5,
    "status": "submitted"
  }
}
```

### Get All Proposals

```bash
curl http://localhost:5000/api/proposals
```

### Cast a Vote

```bash
curl -X POST http://localhost:5000/api/vote \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": 1,
    "voteYes": true
  }'
```

### Check Treasury Status

```bash
curl http://localhost:5000/api/treasury
```

### Get Transaction Log

```bash
curl http://localhost:5000/api/transactions
```

---

## 🌍 Phase 8: Access via Same IP (Network)

To access the DApp from other machines on the **same network**:

### 8.1 Find Your Machine's IP Address

**On Linux/Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Output example:
```
inet 192.168.1.100 netmask 0xff000000 broadcast 192.168.1.255
```

**On Windows:**
```cmd
ipconfig
```

Look for IPv4 Address (e.g., `192.168.1.100`)

### 8.2 Update Backend URL in Frontend

Edit `frontend/.env`:

```env
VITE_API_BASE_URL=http://192.168.1.100:5000/api
VITE_SOCKET_URL=http://192.168.1.100:5000
```

Replace `192.168.1.100` with your actual IP address.

### 8.3 Restart Frontend

```bash
# In Terminal 4
Ctrl+C (to stop current server)
npm run dev
```

### 8.4 Access from Other Machines

From any machine on the same network:

**Browser:**
```
http://192.168.1.100:5173
```

**API Calls:**
```bash
curl http://192.168.1.100:5000/api/proposals
```

### 8.5 Ensure Firewall Allows Traffic

**Linux:**
```bash
sudo ufw allow 5000/tcp
sudo ufw allow 5173/tcp
sudo ufw allow 8545/tcp
```

**Windows:**
- Open Windows Defender Firewall
- Click "Allow an app through firewall"
- Add Node.js and npm to allowed apps

**macOS:**
```bash
# Usually no firewall rules needed for local network
# But if blocked, check: System Preferences → Security & Privacy
```

---

## 📱 Phase 9: NFC Voting Integration

### 9.1 Register NFC ID

Before voting via NFC, register the NFC ID to a wallet address:

```bash
curl -X POST http://192.168.1.100:5000/api/nfc-register \
  -H "Content-Type: application/json" \
  -d '{
    "nfcId": "nfc_001",
    "walletAddress": "0x8ba1f109551bd432803012645ac136ddd64dba72"
  }'
```

### 9.2 Vote via NFC (URL Trigger)

When an NFC tag is tapped on an iPhone, it opens a URL. Examples:

**Vote YES on Proposal 1:**
```
http://192.168.1.100:5000/api/nfc-vote?nfcId=nfc_001&proposalId=1&voteYes=true
```

**Vote NO on Proposal 1:**
```
http://192.168.1.100:5000/api/nfc-vote?nfcId=nfc_001&proposalId=1&voteYes=false
```

### 9.3 Create NFC Tags

Use an **NFC tag writer app** (e.g., "TagWriter" by NXP or "NFC Tools") to:

1. Write URL: `http://192.168.1.100:5000/api/nfc-vote?nfcId=nfc_001&proposalId=1&voteYes=true`
2. Test by tapping tag on iPhone with Safari open

---

## 🔄 Real-Time Updates via WebSocket

The frontend receives real-time updates for:
- **New Proposals:** `proposal-created` event
- **Votes Cast:** `vote-cast` event
- **Fund Transfers:** `funds-transferred` event

The UI auto-refreshes without page reload when these events fire.

---

## 📊 API Endpoints Summary

### Proposals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/proposals` | List all proposals |
| POST | `/api/proposals` | Create new proposal |
| GET | `/api/proposals/:id` | Get proposal details |

### Voting
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vote` | Cast vote (yes/no) |
| GET | `/api/vote/:proposalId/:voterAddress` | Check if voted |

### Treasury
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/treasury` | Get treasury status |
| POST | `/api/treasury/allocate` | Allocate funds to proposal |
| POST | `/api/treasury/transfer` | Transfer from treasury |

### NFC
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nfc-vote` | Vote via NFC tap |
| POST | `/api/nfc-register` | Register NFC ID |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/transactions` | Transaction log |

---

## 🔧 Troubleshooting

### "Failed to resolve import 'ethers'"
```bash
cd frontend && npm install
```

### Contract artifact not found
Make sure you ran:
```bash
cd backend && npm run deploy
```

### "Provider is not properly initialized"
Ensure Hardhat node is running:
```bash
npx hardhat node
```

### "Connection refused on port 8545"
Port 8545 is occupied. Kill the process:
```bash
# Linux/Mac
sudo lsof -i :8545
kill -9 <PID>

# Windows
netstat -ano | findstr :8545
taskkill /PID <PID> /F
```

### MetaMask shows "RPC Error"
1. Check MetaMask network is set to "Hardhat Local"
2. Verify RPC URL is `http://127.0.0.1:8545`
3. Reload page (Cmd+R / Ctrl+R)

### NFC URL not working on iPhone
- Ensure URL is publicly accessible or on same WiFi network
- Use IP address instead of `localhost`
- Test URL in Safari first before creating NFC tag

---

## 🚦 Quick Start Commands

```bash
# Terminal 1: Start blockchain
cd backend && npx hardhat node

# Terminal 2: Deploy contracts
cd backend && npm run deploy

# Terminal 3: Start backend
cd backend && npm start

# Terminal 4: Start frontend
cd frontend && npm run dev

# In another terminal: Test API
curl http://localhost:5000/health
```

---

## 📝 Key Features Implemented

✅ **DAO Smart Contract** (Solidity)
- Create proposals
- Vote with double-voting prevention
- Treasury management
- Event emission

✅ **Blockchain Integration** (ethers.js)
- Real contract deployment
- All data from blockchain
- Event listeners for real-time updates

✅ **Backend API** (Node.js + Express)
- RESTful endpoints
- Socket.IO for real-time updates
- NFC voting support
- Health checks

✅ **Frontend** (React + Vite)
- Connect MetaMask
- Create proposals
- Vote on proposals
- Real-time UI updates
- Treasury dashboard

✅ **NFC Integration**
- URL-based voting trigger
- NFC ID to wallet mapping
- Double-voting prevention on-chain

✅ **Network Access**
- Access via IP on same network
- Firewall configuration
- Multi-device support

---

## 🎯 Next Steps

1. **Customize smart contract** with additional features (staking, quorum, timelock)
2. **Add governance token** for weighted voting
3. **Deploy to testnet** (Sepolia, Mumbai) for testing with real networks
4. **Create React components** for improved UI/UX
5. **Implement wallet delegation** for proxy voting

---

## 📞 Support

For issues, check:
- Hardhat logs in Terminal 1
- Backend logs in Terminal 3
- Frontend console (F12) in browser
- Network connectivity (ping/ifconfig)

---

**Happy DAOing! 🚀**
