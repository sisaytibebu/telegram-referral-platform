import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { getReferrals } from '../services/adminApi';
import styles from './PageLayout.module.css';

export default function Referrals() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (p = 1) => {
    setLoading(true);
    getReferrals({ page: p, limit: 20 })
      .then(r => { setData(r); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'referrer', label: 'Referrer', render: (_: any, row: any) => row.referrer?.first_name || row.referrer?.username || '—' },
    { key: 'referred_user', label: 'Referred', render: (_: any, row: any) => row.referred_user?.first_name || row.referred_user?.username || '—' },
    { key: 'status', label: 'Status', render: (v: any) => <StatusBadge status={v} /> },
    { key: 'reward_amount', label: 'Reward', render: (v: any) => v ? `$${parseFloat(v).toFixed(2)}` : '—' },
    { key: 'created_at', label: 'Date', render: (v: any) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}><h1 className={styles.title}>🔗 Referrals</h1></div>
      <div className={styles.tableCard}>
        <DataTable columns={columns} data={data?.data || []} loading={loading} />
        <Pagination page={page} totalPages={data?.meta?.totalPages || 1}
          onPageChange={p => { setPage(p); load(p); }} />
      </div>
    </div>
  );
}
