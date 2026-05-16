import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { cn } from './utils';

const RISK_CONFIG = {
  NONE:     { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ShieldCheck, label: 'No Risk' },
  LOW:      { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: Shield,      label: 'Low Risk' },
  MEDIUM:   { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: ShieldAlert, label: 'Med Risk' },
  HIGH:     { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  icon: ShieldAlert, label: 'High Risk' },
  CRITICAL: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: ShieldAlert, label: 'Critical' },
};

export const RiskBadge = ({ level, className, showLabel = true }) => {
  if (!level) return null;
  const config = RISK_CONFIG[level] || RISK_CONFIG.NONE;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[var(--radius-xs)] border",
        config.bg, config.color, config.border,
        className
      )}
      title={`AI Risk Level: ${level}`}
    >
      <Icon size={10} />
      {showLabel && config.label}
    </span>
  );
};
