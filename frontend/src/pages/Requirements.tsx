import { useEffect, useState } from 'react';
import { getRequirements, createRequirement, updateRequirement, deleteRequirement } from '../services/adminApi';
import StatusBadge from '../components/StatusBadge';
import styles from './PageLayout.module.css';
import formStyles from './Form.module.css';

const EMPTY = { name: '', type: 'TELEGRAM', telegram_chat_id: '', url: '', description: '', is_enabled: true, order_index: 0 };

export default function Requirements() {
  const [reqs, setReqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    getRequirements().then(r => { setReqs(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing !== null) await updateRequirement(editing, form);
    else await createRequirement(form);
    setForm(EMPTY); setEditing(null); setShowForm(false); load();
  };

  const handleEdit = (req: any) => {
    setForm({ ...req }); setEditing(req.id); setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this requirement?')) return;
    await deleteRequirement(id); load();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>✅ Requirements</h1>
        <button className={formStyles.primaryBtn} onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }}>
          + Add Requirement
        </button>
      </div>

      {showForm && (
        <div className={formStyles.formCard}>
          <h3 className={formStyles.formTitle}>{editing ? 'Edit Requirement' : 'New Requirement'}</h3>
          <div className={formStyles.grid2}>
            <div className={formStyles.field}>
              <label>Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Join Telegram Community 1" />
            </div>
            <div className={formStyles.field}>
              <label>Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="TELEGRAM">TELEGRAM</option>
                <option value="YOUTUBE">YOUTUBE</option>
              </select>
            </div>
            {form.type === 'TELEGRAM' && (
              <div className={formStyles.field}>
                <label>Telegram Chat ID</label>
                <input value={form.telegram_chat_id} onChange={e => setForm({ ...form, telegram_chat_id: e.target.value })} placeholder="-1001234567890" />
              </div>
            )}
            <div className={formStyles.field}>
              <label>URL</label>
              <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://t.me/..." />
            </div>
            <div className={formStyles.field}>
              <label>Order</label>
              <input type="number" value={form.order_index} onChange={e => setForm({ ...form, order_index: parseInt(e.target.value) })} />
            </div>
            <div className={formStyles.field}>
              <label>Enabled</label>
              <select value={form.is_enabled ? 'true' : 'false'} onChange={e => setForm({ ...form, is_enabled: e.target.value === 'true' })}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <div className={formStyles.actions}>
            <button className={formStyles.primaryBtn} onClick={handleSave}>
              {editing ? 'Save Changes' : 'Create'}
            </button>
            <button className={formStyles.cancelBtn} onClick={() => { setShowForm(false); setEditing(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? <p className={styles.loading}>Loading…</p> : (
        <div className={styles.tableCard}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', color: '#c9d1d9' }}>
            <thead>
              <tr style={{ background: '#161b22' }}>
                {['#', 'Name', 'Type', 'Chat ID', 'URL', 'Order', 'Enabled', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#8b949e', borderBottom: '1px solid #30363d' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reqs.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #21262d' }}>
                  <td style={{ padding: '0.7rem 1rem' }}>{r.id}</td>
                  <td style={{ padding: '0.7rem 1rem' }}>{r.name}</td>
                  <td style={{ padding: '0.7rem 1rem' }}><StatusBadge status={r.type} /></td>
                  <td style={{ padding: '0.7rem 1rem' }}><code style={{ fontSize: '0.75rem' }}>{r.telegram_chat_id || '—'}</code></td>
                  <td style={{ padding: '0.7rem 1rem' }}><a href={r.url} target="_blank" rel="noreferrer" style={{ color: '#58a6ff', fontSize: '0.8rem' }}>Open</a></td>
                  <td style={{ padding: '0.7rem 1rem' }}>{r.order_index}</td>
                  <td style={{ padding: '0.7rem 1rem' }}><StatusBadge status={r.is_enabled ? 'ACTIVE' : 'CANCELLED'} /></td>
                  <td style={{ padding: '0.7rem 1rem' }}>
                    <button className={`${styles.actionBtn} ${styles.approveBtn}`} onClick={() => handleEdit(r)}>✏️ Edit</button>
                    <button className={`${styles.actionBtn} ${styles.rejectBtn}`} onClick={() => handleDelete(r.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
