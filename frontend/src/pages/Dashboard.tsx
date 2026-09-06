import { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { getDashboard } from '../services/adminApi';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading dashboard…</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>📊 Dashboard</h1>
      <div className={styles.grid}>
        <StatCard title="Total Users"          value={stats?.total_users ?? 0}         icon="👥" color="#58a6ff" />
        <StatCard title="Active Users"         value={stats?.active_users ?? 0}        icon="✅" color="#3fb950" />
        <StatCard title="Total Referrals"      value={stats?.total_referrals ?? 0}     icon="🔗" color="#d2a8ff" />
        <StatCard title="Qualified Referrals"  value={stats?.qualified_referrals ?? 0} icon="🎯" color="#ffa657" />
        <StatCard title="Total Rewards"        value={`$${stats?.total_rewards ?? '0.00'}`}    icon="💰" color="#3fb950" />
        <StatCard title="Total Withdrawn"      value={`$${stats?.total_withdrawn ?? '0.00'}`}  icon="💸" color="#f85149" />
        <StatCard title="Pending Withdrawals"  value={stats?.pending_withdrawals ?? 0} icon="⏳" color="#d97706" />
      </div>
    </div>
  );
}
