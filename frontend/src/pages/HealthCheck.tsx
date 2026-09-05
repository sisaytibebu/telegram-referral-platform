/**
 * Health Check page — shows backend + DB connection status.
 * Visible at the root URL in Phase 1.
 */
import { useEffect, useState } from 'react';
import { checkHealth, type HealthResponse } from '@/services/api';
import styles from './HealthCheck.module.css';

type Status = 'loading' | 'healthy' | 'degraded' | 'error';

export default function HealthCheck() {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<HealthResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const runCheck = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const result = await checkHealth();
      setData(result);
      const svcStatus = result.data?.status ?? (result.success ? 'healthy' : 'degraded');
      setStatus(svcStatus as Status);
    } catch (err: unknown) {
      setStatus('error');
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Unable to reach the API server.');
      }
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const statusColor: Record<Status, string> = {
    loading: '#6b7280',
    healthy: '#16a34a',
    degraded: '#d97706',
    error: '#dc2626',
  };

  const statusEmoji: Record<Status, string> = {
    loading: '⏳',
    healthy: '✅',
    degraded: '⚠️',
    error: '❌',
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🤖 Telegram Referral Platform</h1>
        <p className={styles.subtitle}>Phase 1 — System Health Check</p>

        <div
          className={styles.statusBadge}
          style={{ backgroundColor: statusColor[status] }}
        >
          {statusEmoji[status]}{' '}
          {status === 'loading' ? 'Checking…' : status.toUpperCase()}
        </div>

        {status !== 'loading' && (
          <div className={styles.details}>
            {status === 'error' ? (
              <div className={styles.errorBox}>
                <strong>Connection failed</strong>
                <p>{errorMsg}</p>
                <p className={styles.hint}>
                  Make sure the backend is running on{' '}
                  <code>http://localhost:5000</code>
                </p>
              </div>
            ) : (
              data && (
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <td>API</td>
                      <td>
                        <ServiceBadge value={data.data?.services.api} />
                      </td>
                    </tr>
                    <tr>
                      <td>Database</td>
                      <td>
                        <ServiceBadge value={data.data?.services.database} />
                      </td>
                    </tr>
                    <tr>
                      <td>Environment</td>
                      <td>{data.data?.environment}</td>
                    </tr>
                    <tr>
                      <td>Version</td>
                      <td>{data.data?.version}</td>
                    </tr>
                    <tr>
                      <td>Uptime</td>
                      <td>{data.data?.uptime}s</td>
                    </tr>
                    <tr>
                      <td>Timestamp</td>
                      <td>{data.data?.timestamp}</td>
                    </tr>
                  </tbody>
                </table>
              )
            )}
          </div>
        )}

        <button className={styles.refreshBtn} onClick={runCheck}>
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}

function ServiceBadge({ value }: { value?: string }) {
  const ok = value === 'running' || value === 'connected';
  return (
    <span
      style={{
        color: ok ? '#16a34a' : '#dc2626',
        fontWeight: 600,
      }}
    >
      {value ?? 'unknown'}
    </span>
  );
}
