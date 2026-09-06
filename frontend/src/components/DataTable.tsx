import styles from './DataTable.module.css';

interface Column { key: string; label: string; render?: (val: any, row: any) => React.ReactNode; }
interface Props { columns: Column[]; data: any[]; loading?: boolean; emptyText?: string; }

export default function DataTable({ columns, data, loading, emptyText = 'No data found' }: Props) {
  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!data?.length) return <div className={styles.empty}>{emptyText}</div>;

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c.key}>
                  {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
