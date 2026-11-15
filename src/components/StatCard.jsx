// Présente un indicateur chiffré avec une animation de valeur.
import { useEffect, useState } from "react";

function AnimatedValue({ value }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const target = Number(value);
    if (!Number.isFinite(target)) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setCount(target));
      return () => cancelAnimationFrame(frame);
    }
    let frame;
    const start = performance.now();
    const animate = (time) => {
      const progress = Math.min(1, (time - start) / 420);
      setCount(Math.round(target * progress));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{count}</>;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "blue",
  onClick,
}) {
  return (
    <article
      className={`stat-card stat-card-${tone} ${onClick ? "stat-card-clickable" : ""}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "link" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>
          <AnimatedValue value={value} />
        </strong>
        <small>{note}</small>
      </div>
    </article>
  );
}
