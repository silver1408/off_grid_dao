import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

const ROUTES = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/swap', label: 'Swap' },
  { to: '/proposals', label: 'Proposals' },
  { to: '/create', label: 'Create' },
];

export function Navbar({ connectionState, treasuryAmount }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⛓️</span>
          <span className={styles.logoText}>
            OFF-GRID <span className={styles.logoAccent}>DAO</span>
          </span>
        </div>
        <span className={styles.headerTag}>Community Governance Kiosk</span>
      </div>

      <nav className={styles.nav} aria-label="Main navigation">
        {ROUTES.map((route) => (
          <NavLink
            key={route.to}
            to={route.to}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`.trim()}
          >
            {route.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.headerRight}>
        <div
          className={`${styles.statusIndicator} ${
            connectionState === 'connected' ? styles.connected : styles.disconnected
          }`}
        >
          <span className={styles.statusDot} />
          <span className={styles.statusText}>
            {connectionState === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className={styles.treasuryBadge}>
          <span className={styles.treasuryIcon}>🏦</span>
          <span className={styles.treasuryAmount}>{treasuryAmount.toLocaleString()}</span>
          <span className={styles.treasuryLabel}>DAO Tokens</span>
        </div>
      </div>
    </header>
  );
}
