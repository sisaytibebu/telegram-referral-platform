import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../services/adminApi';
import styles from './PageLayout.module.css';
import formStyles from './Form.module.css';

export default function Settings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then(r => {
      setSettings(r.data || []);
      const map: Record<string, string> = {};
      (r.data || []).forEach((s: any) => { map[s.key] = s.value || ''; });
      setForm(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    await updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className={styles.page}><p style={{ color: '#8b949e' }}>Loading…</p></div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>⚙️ Settings</h1>
        <button className={formStyles.primaryBtn} onClick={handleSave}>
          {saved ? '✅ Saved!' : 'Save Changes'}
        </button>
      </div>
      <div className={formStyles.formCard}>
        <div className={formStyles.grid2}>
          {settings.map(s => (
            <div key={s.key} className={formStyles.field}>
              <label>{s.key}</label>
              <input
                value={form[s.key] ?? ''}
                onChange={e => setForm({ ...form, [s.key]: e.target.value })}
                placeholder={s.description || s.key}
              />
              {s.description && <small style={{ color: '#8b949e', fontSize: '0.75rem' }}>{s.description}</small>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
