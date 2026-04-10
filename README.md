# 🏛️ OFF-GRID DAO — Full-Stack Blockchain DApp

A **decentralized autonomous organization** (DAO) with **zero mock data**. Everything runs on a local Hardhat blockchain with real smart contracts, voting, treasury management, and NFC integration.

**Status:** ✅ ALL BLOCKCHAIN DATA IS REAL | No simulation | Fully on-chain

---

## 🎯 What You Get

✅ **Smart Contracts (Solidity)**
- DAO contract with proposals, voting, and treasury
- SimpleWallet for deposits/withdrawals
- Real event emission and listeners
- All state stored on-chain

✅ **Backend (Node.js + Express)**
- RESTful API for all DAO operations
- Real-time event listeners via Socket.IO
- NFC voting integration
- Direct blockchain communication via ethers.js

✅ **Frontend (React + Vite)**
- MetaMask wallet connection
- Real-time proposal and voting interface
- Treasury dashboard
- WebSocket updates for instant UI refresh

✅ **Local Blockchain (Hardhat)**
- 10,000 ETH per account
- Instant finality (development)
- Full event logging
- Deploy and test smart contracts locally

✅ **NFC Integration**
- URL-based voting trigger
- iPhone-compatible (SafariScanning)
- NFC ID → Wallet address mapping
- On-chain double-voting prevention

---

## 📂 Project Structure

```
off_grid_dao/
├── backend/                      # Node.js + Express
│   ├── contracts/                # Solidity smart contracts
│   │   ├── DAO.sol              # Main DAO contract
│   │   └── SimpleWallet.sol      # Wallet contract
│   ├── scripts/
│   │   └── deploy.js            # Deploy script
│   ├── services/
│   │   └── blockchain.js        # Web3 service layer
│   ├── artifacts/               # Compiled ABIs & addresses
│   ├── server.js                # Express server
│   ├── package.json
│   └── hardhat.config.cjs       # Hardhat config
│
├── frontend/                     # React + Vite
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API & Web3 services
│   │   ├── context/             # State management
│   │   ├── App.jsx              # Main app
│   │   └── main.jsx             # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── .env                     # Environment config
│
├── SETUP_GUIDE.md               # Full setup instructions
├── FRONTEND_GUIDE.md            # Frontend development guide
└── README.md                    # This file
```

---

## 🚀 Quick Start (5 minutes)

### Terminal 1: Start Blockchain
```bash
cd backend && npx hardhat node
```

### Terminal 2: Deploy Contracts
```bash
cd backend && npm run deploy
```

### Terminal 3: Start Backend
```bash
cd backend && npm start
```

### Terminal 4: Start Frontend
```bash
cd frontend && npm run dev
```

Visit: `http://localhost:5173`

---

## 🔗 API Endpoints

### Proposals
```
POST   /api/proposals               Create proposal
GET    /api/proposals               List all proposals
GET    /api/proposals/:id           Get proposal details
```

### Voting
```
POST   /api/vote                    Cast vote
GET    /api/vote/:proposalId/:addr  Check vote status
```

### Treasury
```
GET    /api/treasury                Get treasury status
POST   /api/treasury/allocate       Allocate funds
POST   /api/treasury/transfer       Transfer from treasury
```

### Wallet
```
GET    /api/wallet/balance          Get wallet balance
GET    /api/wallet/details          Get wallet details
POST   /api/wallet/deposit          Deposit ETH
POST   /api/wallet/withdraw         Withdraw ETH
```

### NFC
```
GET    /api/nfc-vote                Vote via NFC
POST   /api/nfc-register            Register NFC ID
```

### System
```
GET    /health                      Health check
GET    /api/transactions            Transaction log
```

---

## 🌍 Access via Network (Same IP)

### Find Your IP
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Update Frontend `.env`
```env
VITE_API_BASE_URL=http://192.168.1.100:5000/api
VITE_SOCKET_URL=http://192.168.1.100:5000
```

### Access from Other Machines
```
http://192.168.1.100:5173
```

See `SETUP_GUIDE.md` for firewall configuration.

---

## 📱 Smart Contracts

### DAO.sol
**Deploys to blockchain with:**
- Create proposals
- Vote on proposals
- Treasury management
- Event logging
- Double-voting prevention (on-chain)

**Key Functions:**
```solidity
createProposal(title, description, fundsRequested)
vote(proposalId, voteYes)
getAllProposals()
getTreasuryStatus()
transferFromTreasury(recipient, amount)
```

### SimpleWallet.sol
**Basic wallet for deposits/withdrawals**
- Deposit ETH
- Withdraw ETH
- Transfer between accounts
- Balance tracking

---

## 💻 Backend Architecture

```
HTTP Request
    ↓
Express Route Handler
    ↓
Blockchain Service (blockchain.js)
    ↓
ethers.js → Hardhat Node
    ↓
Smart Contract Execution
    ↓
Event Emitted
    ↓
Socket.IO Broadcast
    ↓
Frontend Real-Time Update
```

### Event Listeners

Backend listens for real blockchain events:

```javascript
DAOContract.on('ProposalCreated', (event) => {
  // Broadcast to frontend
  io.emit('proposal-created', event);
});

DAOContract.on('VoteCasted', (event) => {
  // Broadcast to frontend
  io.emit('vote-cast', event);
});
```

---

## ⚛️ Frontend Features

### Pages
- **Dashboard** - View all proposals & treasury
- **Proposals** - Detailed proposal view & voting
- **Create** - Submit new proposal
- **Wallet** - Connect MetaMask, deposit/withdraw

### Components
- ProposalCard - Display proposal
- VoteButton - Cast vote (yes/no)
- TreasuryStatus - Show available funds
- TransactionFeed - Live transaction log
- WalletConnect - MetaMask integration

### Real-Time Updates
- New proposals appear instantly
- Vote counts update live
- Treasury balance syncs
- Zero page refresh

---

## 🔐 Security Features Implemented

✅ **On-Chain Double-Voting Prevention**
```solidity
require(!hasVoted[_proposalId][msg.sender], "Already voted");
```

✅ **Wallet Address Validation**
- MetaMask ensures valid addresses
- Backend validates on every request

✅ **NFC ID Mapping**
- Secure mapping: NFC ID → Wallet Address
- One-way binding (can't reverse-engineer)

✅ **Transaction Verification**
- All votes stored on blockchain
- Immutable transaction history
- Event-based audit trail

---

## 🧪 Testing Locally

### Create Proposal via API
```bash
curl -X POST http://localhost:5000/api/proposals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Proposal",
    "description": "This is a test",
    "fundsRequested": "10"
  }'
```

### Cast Vote via API
```bash
curl -X POST http://localhost:5000/api/vote \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": "1",
    "voteYes": true
  }'
```

### Get Treasury Status
```bash
curl http://localhost:5000/api/treasury
```

---

## 📊 Data Sources

| Feature | Source | Real-Time |
|---------|--------|-----------|
| Proposals | Blockchain (DAO contract) | ✅ Via events |
| Votes | Blockchain (DAO contract) | ✅ Via events |
| Treasury | Blockchain (DAO contract) | ✅ Via events |
| Wallet Balance | Blockchain (Hardhat) | ✅ On-demand |
| Transactions | Backend log + events | ✅ Via WebSocket |

**Zero Mock Data** ✅ Everything comes from blockchain

---

## 🛠️ Development Workflow

### 1. Modify Smart Contract
Edit `backend/contracts/DAO.sol`

### 2. Redeploy
```bash
npm run deploy
```

### 3. Remove Old Frontend Build
```bash
rm -rf frontend/dist
```

### 4. Restart Frontend
Frontend will auto-reload with new contract

### 5. Test via API or UI
Use `curl` or browser to test

---

## 📖 Documentation

- **SETUP_GUIDE.md** - Complete setup & deployment
- **FRONTEND_GUIDE.md** - Frontend development reference
- **Smart Contract Comments** - Inline Solidity documentation

---

## 🚨 Troubleshooting

### "Failed to connect to blockchain"
```bash
# Terminal 1: Ensure Hardhat node is running
npx hardhat node
```

### "Contract artifact not found"
```bash
# Terminal 2: Deploy contracts
npm run deploy
```

### "API connection refused"
```bash
# Terminal 3: Ensure backend is running
npm start

# Check port 5000 is available:
lsof -i :5000
```

### "Frontend shows old data"
```bash
# Clear browser cache:
# - Open DevTools (F12)
# - Settings → Clear cache
# - Reload page
```

### "MetaMask shows wrong network"
```
✓ MetaMask Network: Hardhat Local
✓ RPC URL: http://127.0.0.1:8545
✓ Chain ID: 31337
```

---

## 🎓 Learning Resources

### Understanding DApps
- [Ethereum.org - DApps](https://ethereum.org/developers)
- [ethers.js Documentation](https://docs.ethers.org)

### Hardhat Docs
- [Hardhat Documentation](https://hardhat.org/docs)

### Solidity
- [Solidity by Example](https://solidity-by-example.org)

---

## 🔮 Future Enhancements

- [ ] Add ERC-20 governance token
- [ ] Weighted voting based on token holdings
- [ ] Proposal execution timelock
- [ ] Delegation for proxy voting
- [ ] Multi-sig treasury control
- [ ] Staking for proposal creation
- [ ] DAO token distribution
- [ ] Decentralized snapshot voting
- [ ] Gas-optimized contracts
- [ ] Testnet deployment (Sepolia/Mumbai)

---

## 📝 License

MIT

---

## 🤝 Contributing

Contributions welcome! Areas to improve:

- Smart contract optimization
- Frontend UI enhancements
- Additional voting mechanisms
- Mobile app
- Subgraph (The Graph) integration

---

## 📞 Support

Issues? Check:

1. **Hardhat logs** (Terminal 1)
2. **Backend logs** (Terminal 3)
3. **Browser console** (F12)
4. **SETUP_GUIDE.md** (troubleshooting section)
5. **Network connectivity** (ping your IP)

---

## ✨ Key Takeaways

✅ **All data is from blockchain** - No mocks or simulations
✅ **Real-time updates** - Socket.IO for instant UI refresh
✅ **Complete ownership** - Run on local machine, own the data
✅ **Hackathon-ready** - NFC voting via URL
✅ **Educational** - Learn blockchain development
✅ **Production-grade** - Event-driven architecture

---

**Start building decentralized democracy today! 🚀**

---

*Last Updated: April 2026*
*Version: 1.0.0 — Full Blockchain Integration*
