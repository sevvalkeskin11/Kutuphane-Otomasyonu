const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const VARIANT_MAP = {
  primary: "bg-accent text-white hover:bg-accentDark focus-visible:ring-accent",
  secondary:
    "bg-night text-white hover:bg-nightLight focus-visible:ring-nightLight",
  ghost:
    "bg-transparent text-ink/70 hover:bg-ink/5 hover:text-ink focus-visible:ring-ink/30",
};

const SIZE_MAP = {
  sm: "rounded-lg px-3 py-2 text-sm",
  md: "rounded-lg px-4 py-2.5 text-sm",
  lg: "rounded-lg px-6 py-3 text-base",
  pill: "rounded-full px-8 py-3 text-sm",
};

export default function Button({
  as: Comp = "button",
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const variantClass = VARIANT_MAP[variant] || VARIANT_MAP.primary;
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <Comp
      type={Comp === "button" ? type : undefined}
      className={`${BASE} ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    />
  );
}
