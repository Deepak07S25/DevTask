import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "./utils";

export const Select = ({ value, onChange, placeholder, options, icon }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => String(o.value) === String(value));
  const isActive = !!value && value !== "all";

  return (
    <div ref={ref} className="relative z-20">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 text-sm px-3 h-8 rounded-[var(--radius-md)] border transition-colors duration-[var(--ease-base)] outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          isActive 
            ? "border-blue-500/30 bg-[var(--accent-muted)] text-[var(--accent-text)]"
            : "border-[var(--border)] bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
        )}
      >
        {icon && <span className="opacity-70">{icon}</span>}
        <span className="font-medium whitespace-nowrap min-w-[80px] text-left">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={13} className={cn("opacity-50 transition-transform ml-auto", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] bg-[var(--surface-overlay)] border border-[var(--border-strong)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] min-w-full py-1 max-h-64 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "w-full text-left text-sm px-4 py-2 transition-colors whitespace-nowrap",
                String(value) === String(opt.value) ? "text-[var(--accent-text)] bg-[var(--surface-subtle)] font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
