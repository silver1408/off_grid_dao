import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { daoApi } from "../services/api";
import { getSocket } from "../services/socket";
import { DaoContext } from "./daoContextStore";

const DEFAULT_TAP_PROMPT = "Select a vote to submit it to the blockchain.";

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function unwrap(payload) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }
  return payload;
}

function normalizeProposal(raw) {
  if (!raw) {
    return null;
  }

  const id = toNumber(raw.id ?? raw.proposalId, 0);
  return {
    id,
    title: raw.title || `Proposal #${id}`,
    description: raw.description || "No description provided.",
    votesYes: toNumber(raw.votesYes, 0),
    votesNo: toNumber(raw.votesNo, 0),
    fundsRequested: toNumber(raw.fundsRequested, 0),
    category: raw.category || "Community",
    creator: raw.creator,
    createdAt: raw.createdAt,
    executed: Boolean(raw.executed),
    status: raw.executed ? "executed" : "active",
  };
}

function normalizeTransaction(raw, index = 0) {
  const tx = raw || {};
  const timestamp = tx.timestamp || new Date().toISOString();
  const hash =
    tx.hash ||
    tx.transactionHash ||
    tx.data?.transactionHash ||
    `evt-${new Date(timestamp).getTime()}-${index}`;

  return {
    id: toNumber(tx.id, index + 1),
    type: tx.type || "BLOCK_EVENT",
    hash: String(hash),
    timestamp,
    data: tx.data || null,
  };
}

function normalizeTreasury(raw) {
  const treasury = raw || {};
  const available =
    treasury.availableEth != null
      ? toNumber(treasury.availableEth, 0)
      : toNumber(treasury.totalFunds, 0) - toNumber(treasury.allocated, 0);

  return {
    totalFundsEth: toNumber(treasury.totalFundsEth ?? treasury.totalFunds, 0),
    allocatedEth: toNumber(treasury.allocatedEth ?? treasury.allocated, 0),
    availableEth: Math.max(available, 0),
    totalFundsWei: treasury.totalFundsWei,
    allocatedWei: treasury.allocatedWei,
    availableWei: treasury.availableWei,
  };
}

export function DaoProvider({ children }) {
  const [uiState, setUiState] = useState("BROWSE");
  const [proposals, setProposals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [treasury, setTreasury] = useState(normalizeTreasury());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState("connecting");
  const [pendingVote, setPendingVote] = useState(null);
  const [currentVoter, setCurrentVoter] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [tapError, setTapError] = useState("");
  const [tapPrompt, setTapPrompt] = useState(DEFAULT_TAP_PROMPT);
  const [resetCountdown, setResetCountdown] = useState(15);
  const [flashEffect, setFlashEffect] = useState("");

  const confirmTimerRef = useRef(null);
  const flashTimerRef = useRef(null);

  const updateFlashEffect = useCallback((name) => {
    setFlashEffect(name);
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = setTimeout(() => {
      setFlashEffect("");
    }, 700);
  }, []);

  const clearConfirmTimer = useCallback(() => {
    if (confirmTimerRef.current) {
      clearInterval(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }, []);

  const switchUiState = useCallback((nextState) => {
    setUiState(nextState);
    if (nextState === "BROWSE") {
      setPendingVote(null);
      setTapError("");
      setTapPrompt(DEFAULT_TAP_PROMPT);
    }
  }, []);

  const refreshProposals = useCallback(async () => {
    const payload = await daoApi.getProposals();
    const data = unwrap(payload);
    setProposals(
      Array.isArray(data) ? data.map(normalizeProposal).filter(Boolean) : [],
    );
  }, []);

  const refreshTreasury = useCallback(async () => {
    const payload = await daoApi.getTreasury();
    setTreasury(normalizeTreasury(unwrap(payload)));
  }, []);

  const refreshTransactions = useCallback(async () => {
    const payload = await daoApi.getTransactions();
    const data = unwrap(payload);
    const list = Array.isArray(data) ? data : [];
    setTransactions(
      list.slice(-50).map((item, index) => normalizeTransaction(item, index)),
    );
  }, []);

  const addTransactionToFeed = useCallback((tx) => {
    const normalized = normalizeTransaction(tx, 0);
    setTransactions((prev) => [normalized, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError("");
      try {
        await Promise.all([
          refreshProposals(),
          refreshTreasury(),
          refreshTransactions(),
        ]);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [refreshProposals, refreshTransactions, refreshTreasury]);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnectionState("connected");
    const onDisconnect = () => setConnectionState("disconnected");

    const onInit = (data) => {
      const proposalsData = Array.isArray(data?.proposals)
        ? data.proposals
        : [];
      const txData = Array.isArray(data?.transactions) ? data.transactions : [];

      setProposals(proposalsData.map(normalizeProposal).filter(Boolean));
      setTransactions(
        txData.map((item, index) => normalizeTransaction(item, index)),
      );
      setTreasury(normalizeTreasury(data?.treasury));
    };

    const onProposalCreated = (data) => {
      updateFlashEffect("scan");
      if (data?.transaction) {
        addTransactionToFeed(data.transaction);
      }
      refreshProposals().catch(() => null);
    };

    const onVoteCast = (data) => {
      updateFlashEffect("vote");
      if (data?.transaction) {
        addTransactionToFeed(data.transaction);
      }
      refreshProposals().catch(() => null);
    };

    const onFundsTransferred = (data) => {
      if (data?.transaction) {
        addTransactionToFeed(data.transaction);
      }
      refreshTreasury().catch(() => null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("init", onInit);
    socket.on("proposal-created", onProposalCreated);
    socket.on("vote-cast", onVoteCast);
    socket.on("funds-transferred", onFundsTransferred);

    if (socket.connected) {
      setConnectionState("connected");
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("init", onInit);
      socket.off("proposal-created", onProposalCreated);
      socket.off("vote-cast", onVoteCast);
      socket.off("funds-transferred", onFundsTransferred);
      clearConfirmTimer();
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, [
    addTransactionToFeed,
    clearConfirmTimer,
    refreshProposals,
    refreshTreasury,
    updateFlashEffect,
  ]);

  const submitVote = useCallback(
    async (proposalId, vote) => {
      const voteYes = vote === "yes" || vote === true;
      const payload = await daoApi.castVote({ proposalId, voteYes });
      const data = unwrap(payload);

      const selectedProposal = proposals.find(
        (item) => item.id === toNumber(proposalId, proposalId),
      );
      const voterAddress = data?.voter || "Wallet Connected";

      setCurrentVoter({
        name: "Community Member",
        ward: "Local Resident",
        wallet: voterAddress,
        avatar: "🧑",
      });

      setConfirmation({
        voter: {
          name: "Community Member",
          ward: "Local Resident",
          wallet: voterAddress,
          avatar: "🧑",
        },
        vote: voteYes ? "yes" : "no",
        proposal: selectedProposal || { title: `Proposal #${proposalId}` },
        txHash: data?.transactionHash || "pending",
      });

      addTransactionToFeed({
        type: "VOTE_CAST",
        hash: data?.transactionHash,
        timestamp: new Date().toISOString(),
      });

      switchUiState("CONFIRMED");
      clearConfirmTimer();

      let counter = 10;
      setResetCountdown(counter);
      confirmTimerRef.current = setInterval(() => {
        counter -= 1;
        setResetCountdown(counter);
        if (counter <= 0) {
          clearConfirmTimer();
          switchUiState("BROWSE");
        }
      }, 1000);

      await refreshProposals();
      return data;
    },
    [
      addTransactionToFeed,
      clearConfirmTimer,
      proposals,
      refreshProposals,
      switchUiState,
    ],
  );

  const selectVote = useCallback(
    async (proposalId, vote) => {
      const proposal = proposals.find((item) => item.id === proposalId);
      if (!proposal) {
        return;
      }

      const selection = {
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        vote,
        fundsRequested: proposal.fundsRequested,
      };

      setPendingVote(selection);
      setTapError("");
      setTapPrompt("Submitting your vote to blockchain...");
      switchUiState("AWAIT_TAP");

      try {
        await submitVote(proposal.id, vote);
      } catch (err) {
        setTapError(err.message || "Failed to submit vote");
        setTapPrompt(err.message || "Vote failed. Please try again.");
        setTimeout(() => {
          switchUiState("BROWSE");
        }, 2000);
      }
    },
    [proposals, submitVote, switchUiState],
  );

  const goBackToBrowse = useCallback(() => {
    setPendingVote(null);
    switchUiState("BROWSE");
  }, [switchUiState]);

  const allocateFunds = useCallback(
    async ({ proposalId, amount }) => {
      const payload = await daoApi.allocateFunds({
        proposalId,
        amountEth: amount,
      });
      const data = unwrap(payload);

      addTransactionToFeed({
        type: "FUNDS_TRANSFERRED",
        hash: data?.transactionHash,
        timestamp: new Date().toISOString(),
      });

      await refreshTreasury();
      return data;
    },
    [addTransactionToFeed, refreshTreasury],
  );

  const stats = useMemo(() => {
    const activeProposalCount = proposals.filter(
      (proposal) => proposal.status === "active",
    ).length;
    const totalVoteCount = proposals.reduce(
      (sum, proposal) => sum + proposal.votesYes + proposal.votesNo,
      0,
    );

    return {
      activeProposalCount,
      totalVoteCount,
      blockCount: transactions.length,
    };
  }, [proposals, transactions.length]);

  const treasuryRemaining = useMemo(() => {
    if (treasury?.availableEth != null) {
      return toNumber(treasury.availableEth, 0);
    }
    return Math.max(
      toNumber(treasury?.totalFundsEth, 0) -
        toNumber(treasury?.allocatedEth, 0),
      0,
    );
  }, [treasury]);

  const value = useMemo(
    () => ({
      uiState,
      proposals,
      transactions,
      treasury,
      treasuryRemaining,
      loading,
      error,
      connectionState,
      pendingVote,
      currentVoter,
      confirmation,
      resetCountdown,
      tapError,
      tapPrompt,
      flashEffect,
      stats,
      selectVote,
      goBackToBrowse,
      allocateFunds,
      switchUiState,
      refreshProposals,
      refreshTreasury,
      refreshTransactions,
    }),
    [
      allocateFunds,
      confirmation,
      connectionState,
      currentVoter,
      error,
      flashEffect,
      goBackToBrowse,
      loading,
      pendingVote,
      proposals,
      refreshProposals,
      refreshTransactions,
      refreshTreasury,
      resetCountdown,
      selectVote,
      stats,
      switchUiState,
      tapError,
      tapPrompt,
      transactions,
      treasury,
      treasuryRemaining,
      uiState,
    ],
  );

  return <DaoContext.Provider value={value}>{children}</DaoContext.Provider>;
}
