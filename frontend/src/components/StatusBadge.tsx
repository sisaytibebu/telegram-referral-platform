const colors: Record<string, string> = {
  PENDING:    '#d97706',
  PROCESSING: '#2563eb',
  PAID:       '#16a34a',
  REJECTED:   '#dc2626',
  CANCELLED:  '#6b7280',
  REWARDED:   '#16a34a',
  QUALIFIED:  '#2563eb',
  ACTIVE:     '#16a34a',
  BANNED:     '#dc2626',
  COMPLETED:  '#16a34a',
  FAILED:     '#dc2626',
  VERIFIED:   '#16a34a',
};

export default function StatusBadge({ status }: { status: string }) {
  const color = colors[status?.toUpperCase()] || '#6b7280';
  return (
    <span style={{
      background: `${color}22`, color, border: `1px solid ${color}44`,
      padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
    }}>
      {status}
    </span>
  );
}
