export default function Card({
  as: Component = "section",
  className = "",
  children,
  ...props
}) {
  return (
    <Component className={`panel surface-card ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
