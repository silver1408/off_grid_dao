import styles from './BalanceDisplay.module.css';

export function BalanceDisplay({ details, loading }) {
  if (loading) {
    return <div className={styles.balanceCard}>Loading wallet details...</div>;
  }

  if (!details) {
    return <div className={styles.balanceCard}>Connect a wallet to load on-chain wallet details.</div>;
  }

  return (
    <section className={styles.balanceCard}>
      <h3>On-chain Wallet Details</h3>
      <div className={styles.row}>
        <span>Owner</span>
        <strong>{details.owner}</strong>
      </div>
      <div className={styles.row}>
        <span>Contract</span>
        <strong>{details.contractAddress}</strong>
      </div>
      <div className={styles.row}>
        <span>User Balance</span>
        <strong>{details.userBalanceEth} ETH</strong>
      </div>
      <div className={styles.row}>
        <span>Contract Balance</span>
        <strong>{details.contractBalanceEth} ETH</strong>
      </div>
    </section>
  );
}
