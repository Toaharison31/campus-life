// Crée un bouton icône réutilisable avec un élément DOM référencé.
import { forwardRef } from "react";

const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, title = label, className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`icon-button ${className}`.trim()}
      aria-label={label}
      title={title}
      {...props}
    >
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
});

export default IconButton;
