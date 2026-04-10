# Frontend Blockchain Integration Guide

## Overview

The frontend is a React + Vite application that connects to the OFF-GRID DAO smart contracts via the backend API. All data is real-time with Socket.IO updates.

## Key Components

### 1. API Service (`src/services/api.js`)

Updated with real blockchain endpoints:

```javascript
// Get all proposals (from blockchain)
daoApi.getProposals()

// Create new proposal (writes to blockchain)
daoApi.createProposal({ title, description, fundsRequested })

// Cast vote (writes to blockchain)
daoApi.castVote({ proposalId, voteYes })

// Get treasury status (reads from blockchain)
daoApi.getTreasury()
```

### 2. Socket.IO Service (`src/services/socket.js`)

Real-time event updates from blockchain:

- `proposal-created` - New proposal created
- `vote-cast` - Vote cast on proposal
- `funds-transferred` - Funds transferred from treasury
- `init` - Initial state on connection

### 3. Web3 Service (`src/services/web3.js`)

Enhanced with MetaMask connection guard:

```javascript
// Connect wallet (prevents duplicate requests)
connectWallet()

// Get network info
detectNetwork()

// Helper to shorten addresses
shortenAddress(address)
```

## Pages

### DashboardPage
- Lists all proposals
- Shows treasury status
- Displays transaction feed
- Real-time updates via Socket.IO

### ProposalsPage
- Detailed proposal view
- Vote YES/NO buttons
- Shows vote counts
- Prevents double voting

### CreatePage
- Form to create new proposal
- Input: title, description, funds requested
- Writes to blockchain
- Returns transaction hash

### WalletPage
- Connect MetaMask wallet
- Show wallet balance
- Deposit/Withdraw ETH
- Display wallet details from contracts

### SwapPage
- Token swap interface
- Integration ready (implement as needed)

## Data Flow

```
Blockchain (Hardhat)
       ↓
Backend Server (Node.js + Express)
       ↓ HTTP/REST
Frontend React App
       ↓ Socket.IO
Real-time Updates
       ↓ ethers.js
MetaMask (User Wallet)
```

## Key Features

### 1. Real-Time Voting

When a user votes:

1. Frontend calls `castVote(proposalId, voteYes)`
2. Backend submits transaction to blockchain
3. Contract emits `VoteCasted` event
4. Backend listens and broadcasts via Socket.IO
5. Frontend updates UI in real-time

### 2. MetaMask Integration

Connected via ethers.js BrowserProvider:

```javascript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const userAddress = await signer.getAddress();
```

### 3. NFC Voting

URL-based trigger (for iPhone):

```
http://localhost:5000/api/nfc-vote?nfcId=nfc_001&proposalId=1&voteYes=true
```

Maps NFC ID → wallet address → vote

### 4. Double-Voting Prevention

Enforced on-chain by DAO smart contract:

```solidity
require(!hasVoted[_proposalId][msg.sender], "Already voted");
```

## Component Usage Examples

### Create Proposal

```jsx
import { daoApi } from '../services/api';

export default function CreatePage() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await daoApi.createProposal({
        title: "Park Renovation",
        description: "Renovate the local park",
        fundsRequested: 5
      });
      console.log("Proposal created:", response.data.transactionHash);
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Vote on Proposal

```jsx
import { daoApi } from '../services/api';

export default function VoteButton({ proposalId }) {
  const handleVote = async (voteYes) => {
    try {
      const response = await daoApi.castVote({
        proposalId,
        voteYes
      });
      console.log("Vote recorded:", response.data.transactionHash);
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  return (
    <>
      <button onClick={() => handleVote(true)}>Vote YES</button>
      <button onClick={() => handleVote(false)}>Vote NO</button>
    </>
  );
}
```

### List Proposals

```jsx
import { useEffect, useState } from 'react';
import { daoApi } from '../services/api';

export default function ProposalsList() {
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    daoApi.getProposals()
      .then(response => setProposals(response.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      {proposals.map(p => (
        <div key={p.id}>
          <h3>{p.title}</h3>
          <p>{p.description}</p>
          <p>YES: {p.votesYes} | NO: {p.votesNo}</p>
        </div>
      ))}
    </div>
  );
}
```

## Environment Variables

Create or update `frontend/.env`:

```env
# Local development
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Network access (replace with your IP)
# VITE_API_BASE_URL=http://192.168.1.100:5000/api
# VITE_SOCKET_URL=http://192.168.1.100:5000
```

## Socket.IO Events

### Listen for Real-Time Updates

```javascript
import { getSocket } from '../services/socket';

const socket = getSocket();

socket.on('proposal-created', (event) => {
  console.log("New proposal:", event);
});

socket.on('vote-cast', (event) => {
  console.log("Vote recorded:", event);
});

socket.on('funds-transferred', (event) => {
  console.log("Funds transferred:", event);
});
```

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Request failed (500)" | Backend error | Check backend logs |
| "Already voted" | Double voting attempt | Show: "You already voted" |
| "Insufficient balance" | Not enough funds | Show faucet link |
| "MetaMask not installed" | Wallet not available | Prompt to install |
| "Network mismatch" | Wrong blockchain | Show: "Switch to Hardhat Local" |

## Debugging

### Check API Connectivity

```javascript
// In browser console:
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(err => console.error('API unreachable', err));
```

### Monitor Socket.IO

```javascript
const socket = getSocket();
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

### View Transaction History

```javascript
import { daoApi } from '../services/api';

daoApi.getTransactions()
  .then(res => console.log('Transactions:', res.data));
```

## Build for Production

```bash
cd frontend
npm run build
```

Output: `dist/` folder ready for deployment

To preview:

```bash
npm run start
```

## Deployment

For production with IP access:

1. Update `frontend/.env`:
```env
VITE_API_BASE_URL=http://YOUR_IP:5000/api
VITE_SOCKET_URL=http://YOUR_IP:5000
```

2. Build:
```bash
npm run build
```

3. Serve static files from `dist/`:
```bash
npx http-server dist/
```

Or use your backend to serve:

```javascript
// In backend server.js
app.use(express.static(path.join(__dirname, '../frontend/dist')));
```

## Next Steps

1. **Governance Token** - Add ERC-20 token for weighted voting
2. **Prettier UI** - Enhance components with better styling
3. **Proposal Details** - Add more proposal metadata (creator, status, etc.)
4. **Staking** - Allow users to stake tokens on proposals
5. **Timelock** - Add voting period and execution delay

---

For smart contract details, see `SETUP_GUIDE.md` → Phase 9
