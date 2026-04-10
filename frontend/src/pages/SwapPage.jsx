import { SwapCard } from '../components/swap/SwapCard';
import { useDao } from '../context/daoContextStore';
import styles from './SwapPage.module.css';

export default function SwapPage() {
  const { proposals, allocateFunds } = useDao();

  return (
    <section className={styles.pageWrap}>
      <div className={styles.intro}>
        <h1>Swap & Treasury Allocation</h1>
        <p>Submit secure treasury disbursements to active proposals.</p>
      </div>
      <SwapCard proposals={proposals} onAllocate={allocateFunds} />
    </section>
  );
}
