import styles from './StatCard.module.css';

interface Props {
  title: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export default function StatCard({ title, value, icon = '📊', color = '#58a6ff' }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.icon} style={{ color }}>{icon}</div>
      <div className={styles.value} style={{ color }}>{value}</div>
      <div className={styles.title}>{title}</div>
    </div>
  );
}
