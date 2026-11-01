interface AvatarProps {
  name: string;
  gradient: string; // tailwind gradient e.g. "from-emerald-500 to-teal-600"
  size?: "sm" | "md" | "lg" | "xl";
  title?: string; // "Ustadz", "Ustadzah"
}

const sizeMap = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
};

export default function Avatar({
  name,
  gradient,
  size = "md",
  title,
}: AvatarProps) {
  // take first letters of first two words
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} font-display font-bold text-white shadow-sm ${sizeMap[size]}`}
    >
      {initials}
      {title && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm ring-1 ring-sand-200">
          {title}
        </span>
      )}
    </div>
  );
}
