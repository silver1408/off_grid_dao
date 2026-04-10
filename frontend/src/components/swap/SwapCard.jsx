import { useMemo, useState } from 'react';
import styles from './SwapCard.module.css';

export function SwapCard({ proposals, onAllocate }) {
  const [proposalId, setProposalId] = useState('');
  const [amount, setAmount] = useState('');
  const [cardId, setCardId] = useState('Metro_Card_001');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const availableProposals = useMemo(
    () => proposals.filter((proposal) => proposal.status === 'active'),
    [proposals],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    const parsedProposalId = Number(proposalId);
    const parsedAmount = Number(amount);

    if (!parsedProposalId || !parsedAmount || parsedAmount <= 0) {
      setStatus({ type: 'error', message: 'Enter a valid proposal and transfer amount.' });
      return;
    }

    setSubmitting(true);
    try {
      const result = await onAllocate({
        proposalId: parsedProposalId,
        amount: parsedAmount,
        cardId,
      });

      setStatus({
        type: 'success',
        message: `Fund transfer recorded. TX: ${result.transactionHash.slice(0, 18)}…`,
      });
      setAmount('');
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to allocate funds.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.swapCard}>
      <h2 className={styles.title}>Treasury Swap</h2>
      <p className={styles.subtitle}>Transfer treasury tokens to an active proposal.</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.fieldLabel}>
          Proposal
          <select value={proposalId} onChange={(event) => setProposalId(event.target.value)} className={styles.field}>
            <option value="">Select proposal</option>
            {availableProposals.map((proposal) => (
              <option key={proposal.id} value={proposal.id}>
                {proposal.title}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.fieldLabel}>
          Amount (DAO Tokens)
          <input
            className={styles.field}
            type="number"
            min="1"
            step="1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="5000"
          />
        </label>

        <label className={styles.fieldLabel}>
          Signer Card Id
          <input
            className={styles.field}
            value={cardId}
            onChange={(event) => setCardId(event.target.value)}
            placeholder="Metro_Card_001"
          />
        </label>

        <button type="submit" disabled={submitting} className={styles.submitBtn}>
          {submitting ? 'Submitting...' : 'Transfer Funds'}
        </button>
      </form>

      {status.message && (
        <p className={`${styles.statusMessage} ${status.type === 'error' ? styles.error : styles.success}`}>
          {status.message}
        </p>
      )}
    </section>
  );
}
