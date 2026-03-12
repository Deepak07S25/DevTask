import { Search, X, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

const ISSUE_TYPES = ["EPIC", "STORY", "BUG", "TASK"];

/**
 * FilterBar — a reusable filter toolbar for the Board and Backlog pages.
 *
 * Props:
 *   filters       { search, assigneeId, priority, type }
 *   onFilterChange (key, value) => void
 *   members       [{ id, name }]   — project members for the Assignee dropdown
 *   onClear       () => void
 */
const FilterBar = ({ filters, onFilterChange, members = [], onClear }) => {
  const hasActiveFilters =
    filters.search || filters.assigneeId || filters.priority || filters.type;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
        />
        <input
          id="filter-search"
          type="text"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 text-sm rounded-lg pl-8 pr-3 py-2 outline-none focus:border-sky-500 transition"
        />
        {filters.search && (
          <button
            onClick={() => onFilterChange("search", "")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Assignee dropdown */}
      <FilterSelect
        id="filter-assignee"
        value={filters.assigneeId}
        onChange={(v) => onFilterChange("assigneeId", v)}
        placeholder="Assignee"
        options={members.map((m) => ({ label: m.name, value: m.id }))}
      />

      {/* Priority dropdown */}
      <FilterSelect
        id="filter-priority"
        value={filters.priority}
        onChange={(v) => onFilterChange("priority", v)}
        placeholder="Priority"
        options={PRIORITIES.map((p) => ({ label: p, value: p }))}
      />

      {/* Issue Type dropdown */}
      <FilterSelect
        id="filter-type"
        value={filters.type}
        onChange={(v) => onFilterChange("type", v)}
        placeholder="Type"
        options={ISSUE_TYPES.map((t) => ({ label: t, value: t }))}
      />

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition border border-zinc-700"
        >
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
};

/** Small reusable select dropdown */
const FilterSelect = ({ id, value, onChange, placeholder, options }) => {
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

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition ${
          value
            ? "border-sky-600 text-sky-300 bg-sky-900/20"
            : "border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 bg-zinc-800"
        }`}
      >
        {selected ? selected.label : placeholder}
        <ChevronDown size={13} className="text-zinc-500" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20 min-w-[150px] py-1">
          <button
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full text-left text-sm px-4 py-2 hover:bg-zinc-800 transition ${!value ? "text-sky-400" : "text-zinc-400"}`}
          >
            All
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left text-sm px-4 py-2 hover:bg-zinc-800 transition ${value === opt.value ? "text-sky-400" : "text-zinc-200"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
