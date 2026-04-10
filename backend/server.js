import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  loadArtifact,
  loadDAOArtifact,
  getProvider,
  getSigner,
  getDAOContract,
  getAllProposals,
  getProposal,
  createProposal,
  castVote,
  getTreasuryStatus,
  allocateFunds,
  transferFromTreasury,
  hasUserVoted,
  getUserVote,
  onDAOProposalCreated,
  onDAOVoteCasted,
  onDAOFundsTransferred,
  getWalletDetails,
  getBalance,
  deposit,
  withdraw,
} from "./services/blockchain.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ─────────────────────────────────────────────
// BLOCKCHAIN TRANSACTION LOG
// ─────────────────────────────────────────────
const transactionLog = [];

// ─────────────────────────────────────────────
// EVENT LISTENERS - REAL-TIME BLOCKCHAIN EVENTS
// ─────────────────────────────────────────────

function setupBlockchainEventListeners() {
  console.log("🔌 Setting up blockchain event listeners...");

  try {
    onDAOProposalCreated((event) => {
      console.log(`📋 ProposalCreated Event:`, event);
      transactionLog.push({
        type: "PROPOSAL_CREATED",
        data: event,
        timestamp: new Date().toISOString(),
      });

      io.emit("proposal-created", {
        event,
        transaction: transactionLog[transactionLog.length - 1],
      });
    });

    onDAOVoteCasted((event) => {
      console.log(`🗳️  VoteCasted Event:`, event);
      transactionLog.push({
        type: "VOTE_CAST",
        data: event,
        timestamp: new Date().toISOString(),
      });

      io.emit("vote-cast", {
        event,
        transaction: transactionLog[transactionLog.length - 1],
      });
    });

    onDAOFundsTransferred((event) => {
      console.log(`💰 FundsTransferred Event:`, event);
      transactionLog.push({
        type: "FUNDS_TRANSFERRED",
        data: event,
        timestamp: new Date().toISOString(),
      });

      io.emit("funds-transferred", {
        event,
        transaction: transactionLog[transactionLog.length - 1],
      });
    });

    console.log("✅ Event listeners registered");
  } catch (error) {
    console.warn("⚠️  Could not setup event listeners:", error.message);
  }
}

// ─────────────────────────────────────────────
// API ROUTES - DAO PROPOSALS
// ─────────────────────────────────────────────

app.post("/api/proposals", async (req, res) => {
  try {
    const { title, description, fundsRequested } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    const result = await createProposal(
      title,
      description,
      fundsRequested || 0,
    );

    res.json({
      success: true,
      message: "Proposal created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating proposal:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/proposals", async (req, res) => {
  try {
    const proposals = await getAllProposals();
    res.json({
      success: true,
      data: proposals,
      count: proposals.length,
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/proposals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = await getProposal(id);

    res.json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────
// API ROUTES - DAO VOTING
// ─────────────────────────────────────────────

app.post("/api/vote", async (req, res) => {
  try {
    const { proposalId, voteYes } = req.body;

    if (proposalId === undefined || voteYes === undefined) {
      return res.status(400).json({
        error: "proposalId and voteYes (boolean) are required",
      });
    }

    const result = await castVote(proposalId, voteYes);

    res.json({
      success: true,
      message: "Vote recorded on blockchain",
      data: result,
    });
  } catch (error) {
    console.error("Error casting vote:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/vote/:proposalId/:voterAddress", async (req, res) => {
  try {
    const { proposalId, voterAddress } = req.params;
    const hasVoted = await hasUserVoted(proposalId, voterAddress);
    const vote = hasVoted ? await getUserVote(proposalId, voterAddress) : null;

    res.json({
      success: true,
      data: {
        proposalId,
        voterAddress,
        hasVoted,
        vote,
      },
    });
  } catch (error) {
    console.error("Error checking vote:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────
// API ROUTES - TREASURY
// ─────────────────────────────────────────────

app.get("/api/treasury", async (req, res) => {
  try {
    const treasury = await getTreasuryStatus();

    res.json({
      success: true,
      data: treasury,
    });
  } catch (error) {
    console.error("Error fetching treasury:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/treasury/allocate", async (req, res) => {
  try {
    const { proposalId, amountEth } = req.body;

    if (!proposalId || !amountEth) {
      return res
        .status(400)
        .json({ error: "proposalId and amountEth are required" });
    }

    const result = await allocateFunds(proposalId, amountEth);

    res.json({
      success: true,
      message: "Funds allocated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error allocating funds:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/treasury/transfer", async (req, res) => {
  try {
    const { recipientAddress, amountEth } = req.body;

    if (!recipientAddress || !amountEth) {
      return res
        .status(400)
        .json({ error: "recipientAddress and amountEth are required" });
    }

    const result = await transferFromTreasury(recipientAddress, amountEth);

    res.json({
      success: true,
      message: "Funds transferred from treasury",
      data: result,
    });
  } catch (error) {
    console.error("Error transferring from treasury:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────
// API ROUTES - WALLET
// ─────────────────────────────────────────────

app.get("/api/wallet/balance", async (req, res) => {
  try {
    const data = await getBalance(req.query.address);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/wallet/details", async (req, res) => {
  try {
    const data = await getWalletDetails(req.query.address);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/wallet/deposit", async (req, res) => {
  try {
    const { amountEth } = req.body;
    const data = await deposit(amountEth);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post("/api/wallet/withdraw", async (req, res) => {
  try {
    const { amountEth } = req.body;
    const data = await withdraw(amountEth);
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────
// API ROUTES - NFC VOTING
// ─────────────────────────────────────────────

// Map nfcId -> wallet address (for demo purposes)
const nfcRegistry = {
  nfc_001: "0x8ba1f109551bd432803012645ac136ddd64dba72",
  nfc_002: "0x71c7656ec7ab88b098defb751b7401b5f6d8976f",
  nfc_003: "0xfe3b557e8fb62b89f4b666542121c5c21d544566",
};

app.get("/api/nfc-vote", async (req, res) => {
  try {
    const { nfcId, proposalId, voteYes } = req.query;

    if (!nfcId || proposalId === undefined || voteYes === undefined) {
      return res.status(400).json({
        error: "nfcId, proposalId, and voteYes query parameters required",
      });
    }

    const voterAddress = nfcRegistry[nfcId];
    if (!voterAddress) {
      return res
        .status(404)
        .json({ error: "NFC ID not registered. Please register first." });
    }

    // Check if already voted
    const alreadyVoted = await hasUserVoted(proposalId, voterAddress);
    if (alreadyVoted) {
      return res
        .status(400)
        .json({ error: "You have already voted on this proposal" });
    }

    // Cast vote
    const voteBoolean = voteYes === "true" || voteYes === "1";
    const result = await castVote(proposalId, voteBoolean);

    res.json({
      success: true,
      message: `Vote recorded: ${voteBoolean ? "YES" : "NO"}`,
      data: {
        ...result,
        nfcId,
        voterAddress,
      },
    });
  } catch (error) {
    console.error("Error processing NFC vote:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/nfc-register", (req, res) => {
  try {
    const { nfcId, walletAddress } = req.body;

    if (!nfcId || !walletAddress) {
      return res
        .status(400)
        .json({ error: "nfcId and walletAddress are required" });
    }

    nfcRegistry[nfcId] = walletAddress;

    res.json({
      success: true,
      message: "NFC ID registered",
      data: {
        nfcId,
        walletAddress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────
// API ROUTES - TRANSACTION LOG
// ─────────────────────────────────────────────

app.get("/api/transactions", (req, res) => {
  res.json({
    success: true,
    data: transactionLog.slice(-50),
    count: transactionLog.length,
  });
});

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────

app.get("/health", async (req, res) => {
  try {
    const provider = getProvider();
    const blockNumber = await provider.getBlockNumber();
    const signer = await getSigner();
    const signerAddress = await signer.getAddress();

    res.json({
      success: true,
      status: "healthy",
      data: {
        blockNumber,
        signerAddress,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// SOCKET.IO - REAL-TIME UPDATES
// ─────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("🔌 Dashboard connected:", socket.id);

  // Send current state on connect
  (async () => {
    try {
      const proposals = await getAllProposals();
      const treasury = await getTreasuryStatus();

      socket.emit("init", {
        proposals,
        transactions: transactionLog.slice(-20),
        treasury,
        connectedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error sending init state:", error);
      socket.emit("error", { message: "Failed to load initial state" });
    }
  })();

  socket.on("disconnect", () => {
    console.log("❌ Dashboard disconnected:", socket.id);
  });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    console.log("📦 Loading artifacts...");
    loadArtifact();
    console.log("✅ SimpleWallet artifact loaded");

    loadDAOArtifact();
    console.log("✅ DAO artifact loaded");

    // Setup event listeners
    setupBlockchainEventListeners();

    server.listen(PORT, "0.0.0.0", () => {
      console.log("");
      console.log("═══════════════════════════════════════════════");
      console.log("   🏛️  OFF-GRID DAO — Blockchain-Powered");
      console.log("═══════════════════════════════════════════════");
      console.log(`   API Base:    http://localhost:${PORT}/api`);
      console.log(`   Proposals:   http://localhost:${PORT}/api/proposals`);
      console.log(`   Treasury:    http://localhost:${PORT}/api/treasury`);
      console.log(`   Health:      http://localhost:${PORT}/health`);
      console.log(`   Dashboard:   http://localhost:${PORT}`);
      console.log("═══════════════════════════════════════════════");
      console.log("   Ready for blockchain interactions...");
      console.log("");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exitCode = 1;
  }
}

startServer();
