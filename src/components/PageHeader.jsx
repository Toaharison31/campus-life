// Affiche l'en-tête standard des pages de l'application.
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className = "",
}) {
  return (
    <header className={`page-title-row ${className}`.trim()}>
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
