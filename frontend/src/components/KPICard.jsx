import CountUp from "@/components/CountNumber";

const variants = {
  cyan: {
    bg: "var(--accent-cyan-light)",
    border: "var(--accent-cyan-lighter)",
    bar: "var(--accent-cyan)",
    iconBg: "var(--accent-cyan-lighter)",
    icon: "🌐",
    glow: "var(--accent-cyan-lighter)",
  },
  blue: {
    bg: "var(--accent-blue-light)",
    border: "var(--accent-blue-lighter)",
    bar: "var(--accent-blue)",
    iconBg: "var(--accent-blue-lighter)",
    icon: "⚠️",
    glow: "var(--accent-blue-lighter)",
  },
  green: {
    bg: "var(--accent-green-light)",
    border: "var(--accent-green-lighter)",
    bar: "var(--accent-green)",
    iconBg: "var(--accent-green-lighter)",
    icon: "💰",
    glow: "var(--accent-green-lighter)",
  },
  indigo: {
    bg: "var(--accent-indigo-light)",
    border: "var(--accent-indigo-lighter)",
    bar: "var(--accent-indigo)",
    iconBg: "var(--accent-indigo-lighter)",
    icon: "👥",
    glow: "var(--accent-indigo-lighter)",
  },
};

export default function KPICard({
  label,
  value,
  prefix = "",
  suffix = "",
  variant = "cyan",
}) {
  const v = variants[variant];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-[fadeUp_0.6s_ease-out]"
      style={{
        backgroundColor: v.bg,
        borderColor: v.border,
        boxShadow: '0 14px 35px -14px oklch(0.2 0.02 260 / 0.22)',
      }}
    >
      {/* Left accent bar */}
      <div 
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: v.bar }}
      />

      {/* Content */}
      <div className="flex items-start gap-4">
        
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{ backgroundColor: v.iconBg }}
        >
          {v.icon}
        </div>

        {/* Text */}
        <div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{label}</p>

          <p className="mt-1 text-2xl font-semibold flex items-baseline gap-1" style={{ color: 'var(--card-foreground)' }}>
            {prefix && <span>{prefix}</span>}

            <CountUp
              from={0}
              to={value}
              duration={2}
              separator=","
              className="tracking-tight"
            />

            {suffix && <span className="text-lg">{suffix}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
