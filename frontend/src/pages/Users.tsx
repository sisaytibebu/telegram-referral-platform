import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { getUsers } from '../services/adminApi';
import styles from './PageLayout.module.css';

export default function Users() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (p = 1, s = search) => {
    setLoading(true);
    getUsers({ page: p, limit: 20, search: s })
      .then(r => { setData(r); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'telegram_id', label: 'Telegram ID' },
    { key: 'username', label: 'Username', render: (v: any) => v ? `@${v}` : '—' },
    { key: 'first_name', label: 'Name' },
    { key: 'referral_code', label: 'Ref Code', render: (v: any) => <code>{v}</code> },
    { key: 'balance', label: 'Balance', render: (v: any) => `$${parseFloat(v||0).toFixed(2)}` },
    { key: 'total_earned', label: 'Earned', render: (v: any) => `$${parseFloat(v||0).toFixed(2)}` },
    { key: 'is_banned', label: 'Status', render: (v: any) => <StatusBadge status={v ? 'BANNED' : 'ACTIVE'} /> },
    { key: 'created_at', label: 'Joined', render: (v: any) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>👥 Users</h1>
        <input className={styles.search} placeholder="Search username or name…"
          value={search} onChange={e => { setSearch(e.target.value); load(1, e.target.value); }} />
      </div>
      <div className={styles.tableCard}>
        <DataTable columns={columns} data={data?.data || []} loading={loading} />
        <Pagination page={page} totalPages={data?.meta?.totalPages || 1}
          onPageChange={p => { setPage(p); load(p); }} />
      </div>
    </div>
  );
}
