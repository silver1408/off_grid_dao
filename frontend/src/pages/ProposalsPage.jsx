import { ProposalList } from '../components/proposals/ProposalList';
import { useDao } from '../context/daoContextStore';
import styles from './ProposalsPage.module.css';

export default function ProposalsPage() {
  const { proposals, selectVote } = useDao();

  return (
    <section className={styles.pageWrap}>
      <div className={styles.intro}>
        <h1>Proposal Registry</h1>
        <p>Browse all active proposals and vote with one tap.</p>
      </div>
      <ProposalList proposals={proposals} onVote={selectVote} />
    </section>
  );
}
