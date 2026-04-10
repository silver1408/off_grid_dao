const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const DAO_API_BASE_URL = API_BASE_URL;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error || payload?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export const daoApi = {
  // Proposals
  getProposals() {
    return request('/proposals');
  },

  getProposal(id) {
    return request(`/proposals/${id}`);
  },

  createProposal({ title, description, fundsRequested = 0 }) {
    return request('/proposals', {
      method: 'POST',
      body: JSON.stringify({ title, description, fundsRequested }),
    });
  },

  // Voting
  castVote({ proposalId, voteYes }) {
    return request('/vote', {
      method: 'POST',
      body: JSON.stringify({ proposalId, voteYes }),
    });
  },

  hasVoted(proposalId, voterAddress) {
    return request(`/vote/${proposalId}/${voterAddress}`);
  },

  // Treasury
  getTreasury() {
    return request('/treasury');
  },

  allocateFunds({ proposalId, amountEth }) {
    return request('/treasury/allocate', {
      method: 'POST',
      body: JSON.stringify({ proposalId, amountEth }),
    });
  },

  transferFromTreasury({ recipientAddress, amountEth }) {
    return request('/treasury/transfer', {
      method: 'POST',
      body: JSON.stringify({ recipientAddress, amountEth }),
    });
  },

  // Transactions
  getTransactions() {
    return request('/transactions');
  },

  // NFC
  registerNFC({ nfcId, walletAddress }) {
    return request('/nfc-register', {
      method: 'POST',
      body: JSON.stringify({ nfcId, walletAddress }),
    });
  },

  voteViaNFC({ nfcId, proposalId, voteYes }) {
    const query = new URLSearchParams({ nfcId, proposalId, voteYes });
    return request(`/nfc-vote?${query.toString()}`);
  },

  voteVNFC(params) {
    return this.voteViaNFC(params);
  },

  async getInitialState() {
    const [proposals, treasury, transactions] = await Promise.all([
      this.getProposals(),
      this.getTreasury(),
      this.getTransactions(),
    ]);

    return {
      proposals: proposals?.data || [],
      treasury: treasury?.data || {},
      transactions: transactions?.data || [],
    };
  },
};

export const walletApi = {
  getBalance(address) {
    const query = address ? `?address=${encodeURIComponent(address)}` : '';
    return request(`/wallet/balance${query}`);
  },

  deposit(amountEth) {
    return request('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amountEth }),
    });
  },

  withdraw(amountEth) {
    return request('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amountEth }),
    });
  },

  getWalletDetails(address) {
    const query = address ? `?address=${encodeURIComponent(address)}` : '';
    return request(`/wallet/details${query}`);
  },
};

export { API_BASE_URL, DAO_API_BASE_URL };
