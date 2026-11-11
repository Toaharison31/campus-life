export default function Button({
  as: Component = "button",
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  return (
    <Component
      className={`button button-${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}
