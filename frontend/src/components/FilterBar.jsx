import { Search, X, ChevronDown, Filter } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "../design-system/utils";
import { Button } from "../design-system/Button";
import { IconButton } from "../design-system/IconButton";

const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
const ISSUE_TYPES = ["EPIC", "STORY", "BUG", "TASK"];

/** Small reusable select dropdown aligned with design system */
const FilterDropdown = ({ id, value, onChange, placeholder, options, icon }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);
  const isActive = !!value;

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 text-sm px-3 h-8 rounded-[var(--radius-md)] border transition-colors duration-[var(--ease-base)] outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          isActive 
            ? "border-blue-500/30 bg-[var(--accent-muted)] text-[var(--accent-text)]"
            : "border-[var(--border)] bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
        )}
      >
        {icon && <span className="opacity-70">{icon}</span>}
        <span className="font-medium whitespace-nowrap">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={13} className={cn("opacity-50 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] bg-[var(--surface-overlay)] border border-[var(--border-strong)] rounded-[var(--radius-md)] shadow-[var(--shadow-md)] z-20 min-w-[160px] py-1">
          <button
            onClick={() => { onChange(""); setOpen(false); }}
            className={cn(
              "w-full text-left text-sm px-4 py-2 transition-colors",
              !value ? "text-[var(--accent-text)] bg-[var(--surface-subtle)] font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
            )}
          >
            All {placeholder}
          </button>
          <div className="h-px bg-[var(--border)] my-1 mx-2" />
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "w-full text-left text-sm px-4 py-2 transition-colors",
                value === opt.value ? "text-[var(--accent-text)] bg-[var(--surface-subtle)] font-medium" : "text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]"
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

export const FilterBar = ({ filters, onFilterChange, members = [], onClear }) => {
  const hasActiveFilters = filters.search || filters.assigneeId || filters.priority || filters.type;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-lg)] p-2">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          id="filter-search"
          type="text"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className={cn(
            "w-full h-8 bg-transparent border-none text-sm text-[var(--text-primary)] pl-8 pr-8 outline-none",
            "placeholder-[var(--text-muted)] focus:ring-0"
          )}
        />
        {filters.search && (
          <IconButton
            icon={<X size={13} />}
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange("search", "")}
            className="absolute right-1 top-1/2 -translate-y-1/2"
            label="Clear search"
          />
        )}
      </div>

      <div className="w-px h-5 bg-[var(--border)] hidden sm:block mx-1" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          id="filter-assignee"
          value={filters.assigneeId}
          onChange={(v) => onFilterChange("assigneeId", v)}
          placeholder="Assignee"
          options={members.map((m) => ({ label: m.user?.name ?? m.name, value: m.user?.id ?? m.id }))}
        />
        <FilterDropdown
          id="filter-priority"
          value={filters.priority}
          onChange={(v) => onFilterChange("priority", v)}
          placeholder="Priority"
          options={PRIORITIES.map((p) => ({ label: p, value: p }))}
        />
        <FilterDropdown
          id="filter-type"
          value={filters.type}
          onChange={(v) => onFilterChange("type", v)}
          placeholder="Type"
          options={ISSUE_TYPES.map((t) => ({ label: t, value: t }))}
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={13} />}
            onClick={onClear}
            className="ml-1 text-[var(--text-muted)] hover:text-red-400"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
