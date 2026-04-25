import { useState } from 'react';
import { X, Plus, Trash2, Pencil, Check, GripVertical } from 'lucide-react';
import API from '../api/axios';
import { useToast } from '../design-system/Toast';
import { useConfirm } from '../design-system/Confirm';

const PRESET_COLORS = [
  '#6b7280', '#3b82f6', '#22c55e', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

const BoardSettingsPanel = ({ projectId, columns, onColumnsChanged, onClose }) => {
  const [cols, setCols] = useState(columns);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const { success, error: toastError } = useToast();
  const confirm = useConfirm();

  const refresh = (updated) => {
    setCols(updated);
    onColumnsChanged(updated);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await API.post(`/projects/${projectId}/columns`, { name: newName.trim(), color: newColor });
      const updated = [...cols, res.data];
      refresh(updated);
      setNewName('');
      setNewColor('#6366f1');
      success('Column added');
    } catch (e) {
      toastError(e.response?.data?.error || 'Failed to add column');
    }
    setAdding(false);
  };

  const handleRename = async (col) => {
    if (!editName.trim()) { setEditingId(null); return; }
    try {
      const res = await API.patch(`/projects/${projectId}/columns/${col.id}`, { name: editName.trim(), color: editColor });
      const updated = cols.map((c) => (c.id === col.id ? res.data : c));
      refresh(updated);
      success('Column updated');
    } catch (e) {
      toastError(e.response?.data?.error || 'Failed to update column');
    }
    setEditingId(null);
  };

  const handleDelete = async (col) => {
    const isConfirmed = await confirm({
      title: 'Delete Column',
      message: `Delete "${col.name}"? Tasks will move to the first column.`,
      confirmText: 'Delete',
      danger: true
    });
    if (!isConfirmed) return;
    
    const fallback = cols.find((c) => c.id !== col.id);
    try {
      await API.delete(`/projects/${projectId}/columns/${col.id}`, { data: { fallbackColumnId: fallback?.id } });
      const updated = cols.filter((c) => c.id !== col.id);
      refresh(updated);
      success('Column deleted');
    } catch (e) {
      toastError(e.response?.data?.error || 'Failed to delete column');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-80 bg-zinc-900 border-l border-zinc-800 h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-bold text-white text-base">⚙️ Board Settings</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Columns list */}
        <div className="p-4 flex-1">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Columns</p>
          <div className="space-y-2">
            {cols.map((col) => (
              <div key={col.id} className="flex items-center gap-2 group bg-zinc-800/50 rounded-xl px-3 py-2.5">
                <GripVertical size={14} className="text-zinc-600 flex-shrink-0" />
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />

                {editingId === col.id ? (
                  <>
                    <input
                      autoFocus
                      className="flex-1 min-w-0 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-white outline-none focus:border-sky-500"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename(col)}
                    />
                    <div className="flex gap-1 flex-shrink-0">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          title={c}
                          onClick={() => setEditColor(c)}
                          className={`w-3 h-3 rounded-full border-2 ${editColor === c ? 'border-white' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <button onClick={() => handleRename(col)} className="text-green-400 hover:text-green-300 flex-shrink-0">
                      <Check size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 min-w-0 text-sm text-zinc-200 truncate">{col.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                      <button
                        onClick={() => { setEditingId(col.id); setEditName(col.name); setEditColor(col.color); }}
                        className="p-1 text-zinc-500 hover:text-sky-400 transition"
                      >
                        <Pencil size={13} />
                      </button>
                      {cols.length > 1 && (
                        <button onClick={() => handleDelete(col)} className="p-1 text-zinc-500 hover:text-red-400 transition">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add column */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Add Column</p>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-sky-500 outline-none placeholder-zinc-600"
              placeholder="Column name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            {/* Color picker */}
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  title={c}
                  onClick={() => setNewColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition ${newColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-sm font-bold py-2 rounded-lg transition"
            >
              <Plus size={15} /> {adding ? 'Adding…' : 'Add Column'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardSettingsPanel;
