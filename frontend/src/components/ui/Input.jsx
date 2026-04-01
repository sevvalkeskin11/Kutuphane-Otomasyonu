export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink/40 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/60 ${className}`.trim()}
      {...props}
    />
  );
}
