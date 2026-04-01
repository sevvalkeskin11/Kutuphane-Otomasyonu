export default function Card({
  as: Comp = "div",
  className = "",
  children,
  ...props
}) {
  return (
    <Comp className={`rounded-card bg-white shadow-card ${className}`.trim()} {...props}>
      {children}
    </Comp>
  );
}
