import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import API from '../api/axios';

const DEFAULT_FORM = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  assigneeId: '',
  dueDate: '',
};

const CreateTaskModal = ({ isOpen, onClose, projectId, onTaskCreated }) => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch project members when modal opens
  useEffect(() => {
    if (!isOpen || !projectId) return;
    setFormData(DEFAULT_FORM);
    setError('');
    const fetchMembers = async () => {
      setMembersLoading(true);
      try {
        const res = await API.get(`/projects/${projectId}/members`);
        setMembers(res.data);
      } catch {
        setMembers([]);
      } finally {
        setMembersLoading(false);
      }
    };
    fetchMembers();
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { setError('Task title is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...formData,
        projectId,
        assigneeId: formData.assigneeId || null,
        dueDate: formData.dueDate || null,
      };
      const res = await API.post('/tasks', payload);
      onTaskCreated(res.data);
      onClose();
      setFormData(DEFAULT_FORM);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Add New Task</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              placeholder="What needs to be done?"
              required
              className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 text-white focus:border-sky-500 outline-none placeholder-zinc-600"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea
              placeholder="Add more details..."
              rows="3"
              className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 text-white focus:border-sky-500 outline-none resize-none placeholder-zinc-600"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          {/* Status + Priority */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Status</label>
              <select
                className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 text-white outline-none focus:border-sky-500"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Priority</label>
              <select
                className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 text-white outline-none focus:border-sky-500"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                <option value="LOW">🟢 Low</option>
                <option value="MEDIUM">🟡 Medium</option>
                <option value="HIGH">🔴 High</option>
              </select>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Assignee
              {membersLoading && <span className="ml-2 text-zinc-600">(loading...)</span>}
            </label>
            <select
              className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 text-white outline-none focus:border-sky-500 disabled:opacity-50"
              value={formData.assigneeId}
              onChange={(e) => handleChange('assigneeId', e.target.value)}
              disabled={membersLoading}
            >
              <option value="">— Unassigned —</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Due Date</label>
            <input
              type="date"
              className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 text-white focus:border-sky-500 outline-none"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
            />
          </div>

          {/* Error */}
          {error && <p className="text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg mt-2 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;