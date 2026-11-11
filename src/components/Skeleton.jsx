export default function Skeleton({
  className = "",
  width,
  height,
  rounded = false,
}) {
  return (
    <span
      className={`skeleton ${rounded ? "skeleton-rounded" : ""} ${className}`.trim()}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
