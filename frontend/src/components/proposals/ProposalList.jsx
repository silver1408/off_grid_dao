import { ProposalCard } from './ProposalCard';
import styles from './ProposalList.module.css';

export function ProposalList({ proposals, onVote }) {
  return (
    <div className={styles.proposalsGrid}>
      {proposals.map((proposal) => (
        <ProposalCard key={proposal.id} proposal={proposal} onVote={onVote} />
      ))}
    </div>
  );
}
