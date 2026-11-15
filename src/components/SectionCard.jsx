// Encadre une section dans une carte au style partagé.
import Card from "./Card";

export default function SectionCard({
  icon: Icon,
  title,
  subtitle,
  action,
  className = "",
  children,
  ...props
}) {
  return (
    <Card className={`section-card ${className}`.trim()} {...props}>
      {(Icon || title || subtitle || action) && (
        <header className="section-card-heading">
          {Icon && (
            <span className="section-icon-badge">
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>
          )}
          <div className="section-card-copy">
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </Card>
  );
}
