import styles from './Pagination.module.css';

interface Props { page: number; totalPages: number; onPageChange: (p: number) => void; }

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className={styles.pagination}>
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>← Prev</button>
      <span>Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next →</button>
    </div>
  );
}
