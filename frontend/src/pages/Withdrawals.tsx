import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { getWithdrawals, approveWithdrawal, rejectWithdrawal } from '../services/adminApi';
import styles from './PageLayout.module.css';

const FILTERS = ['PENDING', 'PROCESSING', 'PAID', 'REJECTED', 'ALL'];

export default function Withdrawals() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);

  const load = (p = 1, s = status) => {
    setLoading(true);
    getWithdrawals({ page: p, limit: 20, status: s })
      .then(r => { setData(r); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this withdrawal?')) return;
    await approveWithdrawal(id);
    load();
  };

  const handleReject = async (id: number) => {
    const note = prompt('Rejection reason (optional):') ?? '';
    await rejectWithdrawal(id, note);
    load();
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'user_id', label: 'User ID' },
    { key: 'amount', label: 'Amount', render: (v: any) => `$${parseFloat(v).toFixed(2)}` },
    { key: 'payment_method', label: 'Method' },
    { key: 'status', label: 'Status', render: (v: any) => <StatusBadge status={v} /> },
    { key: 'created_at', label: 'Requested', render: (v: any) => new Date(v).toLocaleDateString() },
    {
      key: 'id', label: 'Actions',
      render: (_: any, row: any) => row.status === 'PENDING' ? (
        <>
          <button className={`${styles.actionBtn} ${styles.approveBtn}`} onClick={() => handleApprove(row.id)}>✅ Approve</button>
          <button className={`${styles.actionBtn} ${styles.rejectBtn}`} onClick={() => handleReject(row.id)}>❌ Reject</button>
        </>
      ) : '—',
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>💸 Withdrawals</h1>
        <div className={styles.filterRow}>
          {FILTERS.map(f => (
            <button key={f}
              className={`${styles.filterBtn} ${status === f ? styles.active : ''}`}
              onClick={() => { setStatus(f); load(1, f); }}
            >{f}</button>
          ))}
        </div>
      </div>
      <div className={styles.tableCard}>
        <DataTable columns={columns} data={data?.data || []} loading={loading} />
        <Pagination page={page} totalPages={data?.meta?.totalPages || 1}
          onPageChange={p => { setPage(p); load(p); }} />
      </div>
    </div>
  );
}
