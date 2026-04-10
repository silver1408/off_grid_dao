## TapDAO — Project Architecture & Workflow

---

### Folder Structure

```
tapDAO/
├── contracts/
│   ├── TapDAO.sol          # Main DAO contract
│   └── hardhat.config.js   # Sepolia testnet config
├── backend/
│   ├── index.js            # Express server
│   ├── nfcAuth.js          # UID → wallet logic
│   └── .env                # RPC URL, private key
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ProposalCard.jsx
│   │   │   ├── VoteResult.jsx
│   │   │   └── WalletBadge.jsx
│   │   ├── hooks/
│   │   │   └── useContract.js   # Ethers.js contract hook
│   │   └── utils/
│   │       └── api.js           # Backend API calls
│   └── vite.config.js
└── README.md
```

---

### Smart Contract Layer (`TapDAO.sol`)

This is your single Solidity file. It holds three things — a proposal store, a voter registry, and the NFC vote function.

```solidity
struct Proposal {
  string title;
  uint yesVotes;
  uint noVotes;
  bool active;
}

mapping(uint => Proposal) public proposals;
mapping(uint => mapping(address => bool)) public hasVoted;

function voteWithNFC(uint proposalId, bool support, bytes memory sig) public {
  bytes32 hash = keccak256(abi.encodePacked(proposalId, support));
  address voter = recoverSigner(hash, sig);
  require(!hasVoted[proposalId][voter], "Already voted");
  hasVoted[proposalId][voter] = true;
  if (support) proposals[proposalId].yesVotes++;
  else proposals[proposalId].noVotes++;
}
```

Deploy this to **Sepolia testnet** using Hardhat. Save the deployed contract address.

---

### Backend Layer (`Node.js + Express`)

Three endpoints only. Keep it minimal.

```
POST /nfc-auth
  → receives { uid }
  → hashes uid with keccak256
  → creates ethers.Wallet from hash
  → signs the vote payload
  → returns { address, signature }

GET /proposals
  → reads proposals from contract via Ethers.js provider
  → returns array of proposal objects

POST /create-proposal
  → admin only (your MetaMask wallet)
  → calls contract.createProposal(title)
```

Your `.env` needs just two things — `SEPOLIA_RPC_URL` (get from Alchemy free tier) and your `ADMIN_PRIVATE_KEY` (your MetaMask wallet for creating proposals).

---

### Frontend Layer (`Vite + React`)

Three screens, no routing library needed — just a `useState` for current view.

**Screen 1 — Home / Proposal List.** Fetches `GET /proposals` on load. Shows proposal cards with title, yes/no vote counts, and a "Vote" button per card.

**Screen 2 — Vote Screen.** When user clicks Vote on a proposal, this screen shows the proposal detail and a big "Tap Your Card to Vote YES / NO" button pair. On click it calls `POST /nfc-auth` with the UID (received from the iPhone Shortcut webhook) and then calls `voteWithNFC` on the contract.

**Screen 3 — Result Screen.** Live reads `proposals[id]` from the contract every 5 seconds and shows a yes/no bar chart. This is your demo money shot.

---

### iPhone Shortcut (the NFC bridge)

This replaces any native app entirely. Set it up once in 2 minutes.

```
Shortcut steps:
1. "Scan NFC Tag"         → reads card UID
2. "Get contents of URL"  → POST to http://YOUR_IP:3000/nfc-auth
                            Body: { "uid": [NFC tag UID] }
3. "Show notification"    → "Vote submitted!"
```

Run your Node server on your laptop, make sure your iPhone and laptop are on the same WiFi. Use your laptop's local IP (e.g. `192.168.1.5:3000`) as the URL.

---

### Data Flow Summary

```
iPhone tap
  → Shortcut reads UID
    → POST /nfc-auth (Node.js)
      → keccak256(uid) = privateKey
        → ethers.Wallet(privateKey).signMessage(votePayload)
          → { address, signature } returned to frontend
            → contract.voteWithNFC(proposalId, support, signature)
              → ecrecover() verifies signer on-chain
                → vote stored in mapping
                  → UI polls and updates live
```

---

### Environment & Tools Checklist

| Tool | Purpose | Where to get |
|---|---|---|
| Hardhat | compile + deploy Solidity | `npm i hardhat` |
| Alchemy | Sepolia RPC URL | alchemy.com free tier |
| Ethers.js v6 | wallet, signing, contract calls | `npm i ethers` |
| Express | backend server | `npm i express` |
| Vite + React | frontend | `npm create vite@latest` |
| MetaMask | admin wallet + Sepolia ETH | already have it |
| Sepolia faucet | test ETH for deployment | sepoliafaucet.com |

---

