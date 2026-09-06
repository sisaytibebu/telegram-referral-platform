import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

const navItems = [
  { to: '/dashboard',    label: '📊 Dashboard'    },
  { to: '/users',        label: '👥 Users'         },
  { to: '/referrals',    label: '🔗 Referrals'     },
  { to: '/transactions', label: '💰 Transactions'  },
  { to: '/withdrawals',  label: '💸 Withdrawals'   },
  { to: '/requirements', label: '✅ Requirements'  },
  { to: '/settings',     label: '⚙️ Settings'      },
  { to: '/audit-logs',   label: '📋 Audit Logs'    },
];

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>🤖 Crypto Give Away</div>
        <nav className={styles.nav}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.userSection}>
          <span className={styles.username}>👤 {admin?.username}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
