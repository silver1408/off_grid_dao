import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { daoApi } from '../services/api';
import { getSocket } from '../services/socket';
import { DaoContext } from './daoContextStore';

const DEFAULT_TAP_PROMPT = 'Hold your NFC community card near the kiosk to sign and submit your vote to the blockchain';

export function DaoProvider({ children }) {
  const [uiState, setUiState] = useState('BROWSE');
  const [proposals, setProposals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [treasury, setTreasury] = useState({ totalFunds: 0, allocated: 0, currency: 'DAO Tokens' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionState, setConnectionState] = useState('connecting');
  const [pendingVote, setPendingVote] = useState(null);
  const [currentVoter, setCurrentVoter] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [tapError, setTapError] = useState('');
  const [tapPrompt, setTapPrompt] = useState(DEFAULT_TAP_PROMPT);
  const [resetCountdown, setResetCountdown] = useState(15);
  const [flashEffect, setFlashEffect] = useState('');

  const pendingVoteRef = useRef(null);
  const uiStateRef = useRef('BROWSE');
  const awaitingTimerRef = useRef(null);
  const confirmTimerRef = useRef(null);
  const flashTimerRef = useRef(null);

  const updateFlashEffect = useCallback((name) => {
    setFlashEffect(name);
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = setTimeout(() => {
      setFlashEffect('');
    }, 800);
  }, []);

  const clearAwaitingTimer = useCallback(() => {
    if (awaitingTimerRef.current) {
      clearTimeout(awaitingTimerRef.current);
      awaitingTimerRef.current = null;
    }
  }, []);

  const clearConfirmTimer = useCallback(() => {
    if (confirmTimerRef.current) {
      clearInterval(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
  }, []);

  const addTransactionToFeed = useCallback((tx) => {
    if (!tx) {
      return;
    }

    setTransactions((prev) => [tx, ...prev].slice(0, 30));
  }, []);

  const switchUiState = useCallback(
    (nextState) => {
      uiStateRef.current = nextState;
      setUiState(nextState);

      if (nextState === 'BROWSE') {
        clearAwaitingTimer();
        clearConfirmTimer();
        pendingVoteRef.current = null;
        setPendingVote(null);
        setTapError('');
        setTapPrompt(DEFAULT_TAP_PROMPT);
      }

      if (nextState === 'CONFIRMED') {
        clearAwaitingTimer();
      }
    },
    [clearAwaitingTimer, clearConfirmTimer],
  );

  const submitVote = useCallback(async (cardId, proposalId, vote) => {
    try {
      await daoApi.castVote({ cardId, proposalId, vote });
    } catch (err) {
      setTapError(err.message);
      setTapPrompt(err.message);
      setTimeout(() => {
        setTapError('');
        setTapPrompt(DEFAULT_TAP_PROMPT);
      }, 3000);
    }
  }, []);

  const selectVote = useCallback(
    (proposalId, vote) => {
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

      pendingVoteRef.current = selection;
      setPendingVote(selection);
      setTapError('');
      setTapPrompt(DEFAULT_TAP_PROMPT);
      switchUiState('AWAIT_TAP');

      clearAwaitingTimer();
      awaitingTimerRef.current = setTimeout(() => {
        pendingVoteRef.current = null;
        setPendingVote(null);
        switchUiState('BROWSE');
      }, 60000);
    },
    [clearAwaitingTimer, proposals, switchUiState],
  );

  const goBackToBrowse = useCallback(() => {
    pendingVoteRef.current = null;
    setPendingVote(null);
    switchUiState('BROWSE');
  }, [switchUiState]);

  const allocateFunds = useCallback(async ({ proposalId, amount, cardId = 'system' }) => {
    const payload = {
      cardId,
      proposalId,
      amount,
    };

    const result = await daoApi.allocateFunds(payload);

    if (result?.treasury) {
      setTreasury(result.treasury);
    }

    return result;
  }, []);

  useEffect(() => {
    pendingVoteRef.current = pendingVote;
  }, [pendingVote]);

  useEffect(() => {
    uiStateRef.current = uiState;
  }, [uiState]);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      setError('');
      try {
        const initial = await daoApi.getInitialState();
        setProposals(initial.proposals || []);
        setTransactions([...(initial.transactions || [])].reverse().slice(0, 30));
        setTreasury(initial.treasury || { totalFunds: 0, allocated: 0, currency: 'DAO Tokens' });
        setCurrentVoter(initial.currentVoter || null);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setConnectionState('connected');
    const onDisconnect = () => setConnectionState('disconnected');

    const onInit = (data) => {
      setProposals(data?.proposals || []);
      setTransactions([...(data?.transactions || [])].reverse().slice(0, 30));
      if (data?.treasury) {
        setTreasury(data.treasury);
      }
      if (data?.currentVoter) {
        setCurrentVoter(data.currentVoter);
      }
    };

    const onCardScanned = (data) => {
      updateFlashEffect('scan');

      if (uiStateRef.current !== 'AWAIT_TAP' || !pendingVoteRef.current) {
        return;
      }

      setCurrentVoter(data.voter);
      addTransactionToFeed(data.transaction);

      submitVote(data.voter.cardId, pendingVoteRef.current.proposalId, pendingVoteRef.current.vote);
    };

    const onVoteRecorded = (data) => {
      updateFlashEffect('vote');

      setProposals((prev) =>
        prev.map((proposal) => (proposal.id === data.proposal.id ? data.proposal : proposal)),
      );

      addTransactionToFeed(data.transaction);

      const detail = {
        voter: data.voter,
        vote: data.vote,
        proposal: data.proposal,
        txHash: data.transaction.hash,
      };

      setConfirmation(detail);
      setCurrentVoter(data.voter);
      pendingVoteRef.current = null;
      setPendingVote(null);
      switchUiState('CONFIRMED');

      clearConfirmTimer();
      let counter = 15;
      setResetCountdown(counter);
      confirmTimerRef.current = setInterval(() => {
        counter -= 1;
        setResetCountdown(counter);
        if (counter <= 0) {
          clearConfirmTimer();
          switchUiState('BROWSE');
        }
      }, 1000);
    };

    const onFundAllocated = (data) => {
      addTransactionToFeed(data.transaction);
      if (data?.treasury) {
        setTreasury(data.treasury);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('init', onInit);
    socket.on('card-scanned', onCardScanned);
    socket.on('vote-recorded', onVoteRecorded);
    socket.on('fund-allocated', onFundAllocated);

    if (socket.connected) {
      setConnectionState('connected');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('init', onInit);
      socket.off('card-scanned', onCardScanned);
      socket.off('vote-recorded', onVoteRecorded);
      socket.off('fund-allocated', onFundAllocated);
      clearAwaitingTimer();
      clearConfirmTimer();
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, [addTransactionToFeed, clearAwaitingTimer, clearConfirmTimer, submitVote, switchUiState, updateFlashEffect]);

  const stats = useMemo(() => {
    const activeProposalCount = proposals.filter((proposal) => proposal.status === 'active').length;
    const totalVoteCount = proposals.reduce((sum, proposal) => sum + proposal.votesYes + proposal.votesNo, 0);

    return {
      activeProposalCount,
      totalVoteCount,
      blockCount: transactions.length,
    };
  }, [proposals, transactions.length]);

  const treasuryRemaining = useMemo(
    () => Math.max((treasury?.totalFunds || 0) - (treasury?.allocated || 0), 0),
    [treasury],
  );

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
