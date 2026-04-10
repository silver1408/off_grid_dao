import { useState } from 'react';
import styles from './TransactionForm.module.css';

export function TransactionForm({ type, onSubmit, submitting }) {
  const [amountEth, setAmountEth] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!amountEth) {
      return;
    }

    await onSubmit(amountEth);
    setAmountEth('');
  }

  const actionLabel = type === 'deposit' ? 'Deposit ETH' : 'Withdraw ETH';

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.fieldLabel}>
        Amount (ETH)
        <input
          className={styles.field}
          type="number"
          step="0.001"
          min="0.001"
          value={amountEth}
          onChange={(event) => setAmountEth(event.target.value)}
          placeholder="0.1"
        />
      </label>
      <button className={styles.actionBtn} type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : actionLabel}
      </button>
    </form>
  );
}
