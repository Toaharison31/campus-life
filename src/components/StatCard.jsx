export default function StatCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "blue",
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={19} strokeWidth={1.8} />
      </div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}
