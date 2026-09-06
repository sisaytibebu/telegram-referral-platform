import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import { getAuditLogs } from '../services/adminApi';
import styles from './PageLayout.module.css';

export default function AuditLogs() {
  const [data, setData] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (p = 1) => {
    setLoading(true);
    getAuditLogs({ page: p, limit: 20 })
      .then(r => { setData(r); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'Admin', label: 'Admin', render: (_: any, row: any) => row.Admin?.username || '—' },
    { key: 'action', label: 'Action', render: (v: any) => <code style={{ fontSize: '0.75rem' }}>{v}</code> },
    { key: 'entity_type', label: 'Entity' },
    { key: 'entity_id', label: 'Entity ID' },
    { key: 'ip_address', label: 'IP' },
    { key: 'created_at', label: 'Date', render: (v: any) => new Date(v).toLocaleString() },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}><h1 className={styles.title}>📋 Audit Logs</h1></div>
      <div className={styles.tableCard}>
        <DataTable columns={columns} data={data?.data || []} loading={loading} />
        <Pagination page={page} totalPages={data?.meta?.totalPages || 1}
          onPageChange={p => { setPage(p); load(p); }} />
      </div>
    </div>
  );
}
