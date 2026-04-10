const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ─────────────────────────────────────────────
//  SIMULATED BLOCKCHAIN
// ─────────────────────────────────────────────
const blockchain = [];

function createTransaction(type, data) {
    const prevHash = blockchain.length > 0
        ? blockchain[blockchain.length - 1].hash
        : '0000000000000000000000000000000000000000000000000000000000000000';

    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({ type, data, timestamp, prevHash });
    const hash = crypto.createHash('sha256').update(payload).digest('hex');

    const tx = {
        id: blockchain.length + 1,
        type,        // 'IDENTITY_VERIFY' | 'VOTE_CAST' | 'FUND_TRANSFER'
        data,
        timestamp,
        prevHash,
        hash,
    };

    blockchain.push(tx);
    console.log(`⛓️  Block #${tx.id} | ${type} | ${hash.slice(0, 16)}...`);
    return tx;
}

// ─────────────────────────────────────────────
//  VOTER REGISTRY (In-Memory for Demo)
// ─────────────────────────────────────────────
const voters = {
    'Metro_Card_001': {
        name: 'Grandma Patel',
        avatar: '👵',
        wallet: '0x7a3B...f29E',
        ward: 'Sector 7, Green Park Colony',
        votescast: 0,
    },
    'Metro_Card_002': {
        name: 'Uncle Sharma',
        avatar: '👴',
        wallet: '0x9c1D...a83F',
        ward: 'Sector 12, Riverside',
        votescast: 0,
    },
    'Metro_Card_003': {
        name: 'Auntie Mehra',
        avatar: '👩',
        wallet: '0x4e8A...b12C',
        ward: 'Sector 3, Market Road',
        votescast: 0,
    },
    // Fallback for any unknown card (e.g. your actual metro card)
};

function getVoter(cardId) {
    if (voters[cardId]) return { cardId, ...voters[cardId] };
    // For unknown cards, generate a demo identity
    return {
        cardId,
        name: 'Community Member',
        avatar: '🧑',
        wallet: '0x' + crypto.createHash('md5').update(cardId).digest('hex').slice(0, 16),
        ward: 'Local Resident',
        votescast: 0,
    };
}

// ─────────────────────────────────────────────
//  COMMUNITY PROPOSALS
// ─────────────────────────────────────────────
const proposals = [
    {
        id: 1,
        title: 'Park Bench Renovation',
        description: 'Install 12 new solar-powered benches in Green Park with USB charging stations for residents.',
        category: 'Infrastructure',
        fundsRequested: 45000,
        votesYes: 23,
        votesNo: 5,
        status: 'active',
        votedBy: [],
    },
    {
        id: 2,
        title: 'Community Solar Panels',
        description: 'Install rooftop solar panels on the community hall to reduce electricity bills by 60%.',
        category: 'Energy',
        fundsRequested: 120000,
        votesYes: 41,
        votesNo: 8,
        status: 'active',
        votedBy: [],
    },
    {
        id: 3,
        title: 'Free Wi-Fi Zones',
        description: 'Set up 5 free Wi-Fi hotspots in public areas — park, market, bus stop, library, and temple.',
        category: 'Digital',
        fundsRequested: 30000,
        votesYes: 67,
        votesNo: 12,
        status: 'active',
        votedBy: [],
    },
];

// Community Treasury
const treasury = {
    totalFunds: 500000,
    allocated: 0,
    currency: 'DAO Tokens',
};

// Track currently identified voter (for demo simplicity — single kiosk)
let currentVoter = null;

// ─────────────────────────────────────────────
//  API ROUTES
// ─────────────────────────────────────────────

// NFC Scan → Identify Voter
app.get('/scan', (req, res) => {
    const cardId = req.query.cardId || 'Unknown_Card';
    console.log(`\n📡 NFC SCAN DETECTED: ${cardId}`);

    const voter = getVoter(cardId);
    currentVoter = voter;

    // Log to blockchain
    const tx = createTransaction('IDENTITY_VERIFY', {
        cardId,
        voterName: voter.name,
        wallet: voter.wallet,
    });

    // Broadcast to all connected dashboards
    io.emit('card-scanned', {
        voter,
        transaction: tx,
    });

    res.json({
        success: true,
        message: `Welcome, ${voter.name}!`,
        voter,
        transactionHash: tx.hash,
    });
});

// Cast a vote
app.post('/vote', (req, res) => {
    const { cardId, proposalId, vote } = req.body;

    if (!cardId || !proposalId || !vote) {
        return res.status(400).json({ error: 'Missing cardId, proposalId, or vote' });
    }

    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) {
        return res.status(404).json({ error: 'Proposal not found' });
    }

    // Record vote (double-voting allowed for demo purposes)
    if (vote === 'yes') {
        proposal.votesYes++;
    } else {
        proposal.votesNo++;
    }

    const voter = getVoter(cardId);
    if (voters[cardId]) voters[cardId].votescast++;

    // Log to blockchain
    const tx = createTransaction('VOTE_CAST', {
        cardId,
        voterName: voter.name,
        proposalId,
        proposalTitle: proposal.title,
        vote,
    });

    console.log(`🗳️  VOTE: ${voter.name} voted "${vote}" on "${proposal.title}"`);

    // Broadcast update
    io.emit('vote-recorded', {
        voter,
        proposal,
        vote,
        transaction: tx,
    });

    res.json({
        success: true,
        message: `Vote recorded: ${vote} on "${proposal.title}"`,
        transactionHash: tx.hash,
    });
});

// Allocate funds to a proposal
app.post('/fund', (req, res) => {
    const { cardId, proposalId, amount } = req.body;

    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    const voter = getVoter(cardId || 'system');

    const tx = createTransaction('FUND_TRANSFER', {
        from: voter.wallet,
        to: `Proposal #${proposalId}: ${proposal.title}`,
        amount,
        currency: treasury.currency,
    });

    treasury.allocated += amount;

    io.emit('fund-allocated', {
        voter,
        proposal,
        amount,
        treasury,
        transaction: tx,
    });

    res.json({ success: true, transactionHash: tx.hash, treasury });
});

// Get all proposals
app.get('/proposals', (req, res) => {
    res.json(proposals);
});

// Get transaction history
app.get('/transactions', (req, res) => {
    res.json(blockchain.slice(-50)); // last 50
});

// Get treasury status
app.get('/treasury', (req, res) => {
    res.json(treasury);
});

// Get current voter
app.get('/current-voter', (req, res) => {
    res.json(currentVoter);
});

// ─────────────────────────────────────────────
//  SOCKET.IO
// ─────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log('🔌 Dashboard connected:', socket.id);

    // Send current state on connect
    socket.emit('init', {
        proposals,
        transactions: blockchain.slice(-20),
        treasury,
        currentVoter,
    });

    socket.on('disconnect', () => {
        console.log('❌ Dashboard disconnected:', socket.id);
    });
});

// ─────────────────────────────────────────────
//  START SERVER
// ─────────────────────────────────────────────
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('   🏛️  OFF-GRID DAO — Community Voting Kiosk');
    console.log('═══════════════════════════════════════════════');
    console.log(`   Dashboard:  http://localhost:${PORT}`);
    console.log(`   NFC Scan:   http://localhost:${PORT}/scan?cardId=Metro_Card_001`);
    console.log(`   Proposals:  http://localhost:${PORT}/proposals`);
    console.log('═══════════════════════════════════════════════');
    console.log('   Waiting for NFC card tap...');
    console.log('');
});
