import styles from './TransactionFeed.module.css';

export function TransactionFeed({ transactions }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.feedLabel}>⛓️ Live Blockchain Feed</div>
      <div className={styles.feedScroll}>
        {transactions.length === 0 && (
          <div className={`${styles.feedItem} ${styles.genesisItem}`}>
            <span className={styles.feedBlock}>#0</span>
            <span className={styles.feedType}>GENESIS</span>
            <span className={styles.feedHash}>0000000000000000</span>
            <span className={styles.feedTime}>System Start</span>
          </div>
        )}
        {transactions.map((tx) => {
          const time = new Date(tx.timestamp).toLocaleTimeString();
          const txTypeClassName = styles[`feedType${tx.type}`] || '';

          return (
            <div key={`${tx.id}-${tx.hash}`} className={styles.feedItem}>
              <span className={styles.feedBlock}>#{tx.id}</span>
              <span className={`${styles.feedType} ${txTypeClassName}`}>{tx.type.replace('_', ' ')}</span>
              <span className={styles.feedHash}>{tx.hash.slice(0, 16)}…</span>
              <span className={styles.feedTime}>{time}</span>
            </div>
          );
        })}
      </div>
    </footer>
  );
}
