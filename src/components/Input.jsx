export default function Input({
  label,
  id,
  error,
  className = "",
  as: Component = "input",
  ...props
}) {
  return (
    <label
      className={`ui-field ui-field-floating ${error ? "ui-field-error" : ""} ${className}`}
    >
      <span>{label}</span>
      <Component
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <small id={id ? `${id}-error` : undefined} role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
