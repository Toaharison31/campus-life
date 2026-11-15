// Affiche un badge dont l'apparence dépend de sa tonalité.
export default function Badge({ tone = "neutral", className = "", children }) {
  return (
    <span className={`ui-badge ui-badge-${tone} ${className}`.trim()}>
      {children}
    </span>
  );
}
