import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { getTransactions } from '../services/adminApi';
import styles from './PageLayout.module.css';

export default function Transactions() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (p = 1) => {
    setLoading(true);
    getTransactions({ page: p, limit: 20 })
      .then(r => { setData(r); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user_id', label: 'User' },
    { key: 'type', label: 'Type', render: (v: any) => <code style={{ fontSize: '0.75rem' }}>{v}</code> },
    { key: 'amount', label: 'Amount', render: (v: any) => {
      const n = parseFloat(v);
      return <span style={{ color: n >= 0 ? '#3fb950' : '#f85149' }}>{n >= 0 ? '+' : ''}${Math.abs(n).toFixed(2)}</span>;
    }},
    { key: 'balance_after', label: 'Balance After', render: (v: any) => `$${parseFloat(v).toFixed(2)}` },
    { key: 'status', label: 'Status', render: (v: any) => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Date', render: (v: any) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}><h1 className={styles.title}>💰 Transactions</h1></div>
      <div className={styles.tableCard}>
        <DataTable columns={columns} data={data?.data || []} loading={loading} />
        <Pagination page={page} totalPages={data?.meta?.totalPages || 1}
          onPageChange={p => { setPage(p); load(p); }} />
      </div>
    </div>
  );
}
