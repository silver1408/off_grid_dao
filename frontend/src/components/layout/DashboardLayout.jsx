import { Outlet } from 'react-router-dom';
import { useDao } from '../../context/daoContextStore';
import { Navbar } from '../navigation/Navbar';
import { TransactionFeed } from '../transactions/TransactionFeed';
import styles from './DashboardLayout.module.css';

export function DashboardLayout() {
  const { connectionState, treasuryRemaining, transactions, flashEffect } = useDao();

  return (
    <div className={styles.appShell}>
      <div className={styles.bgGrid} />
      <div className={`${styles.bgGlow} ${styles.bgGlow1}`} />
      <div className={`${styles.bgGlow} ${styles.bgGlow2}`} />
      <div className={`${styles.bgGlow} ${styles.bgGlow3}`} />

      {flashEffect === 'scan' && <div className={styles.scanFlash} />}
      {flashEffect === 'vote' && <div className={styles.voteFlash} />}

      <Navbar connectionState={connectionState} treasuryAmount={treasuryRemaining} />

      <main className={styles.mainContent}>
        <Outlet />
      </main>

      <TransactionFeed transactions={transactions} />
    </div>
  );
}
