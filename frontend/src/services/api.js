const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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
  getProposals() {
    return request('/proposals');
  },

  getTransactions() {
    return request('/transactions');
  },

  getTreasury() {
    return request('/treasury');
  },

  getCurrentVoter() {
    return request('/current-voter');
  },

  castVote({ cardId, proposalId, vote }) {
    return request('/vote', {
      method: 'POST',
      body: JSON.stringify({ cardId, proposalId, vote }),
    });
  },

  allocateFunds({ cardId, proposalId, amount }) {
    return request('/fund', {
      method: 'POST',
      body: JSON.stringify({ cardId, proposalId, amount }),
    });
  },

  scanCard(cardId) {
    const query = new URLSearchParams({ cardId });
    return request(`/scan?${query.toString()}`);
  },

  async getInitialState() {
    const [proposals, transactions, treasury, currentVoter] = await Promise.all([
      this.getProposals(),
      this.getTransactions(),
      this.getTreasury(),
      this.getCurrentVoter(),
    ]);

    return { proposals, transactions, treasury, currentVoter };
  },
};

export { API_BASE_URL };
