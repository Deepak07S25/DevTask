import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import API from '../api/axios';
import MarkdownEditor from './MarkdownEditor';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input } from '../design-system/Input';
import { cn } from '../design-system/utils';

const DEFAULT_FORM = {
  title: '',
  description: '',
  type: 'TASK',
  epicId: '',
  status: 'TODO',
  priority: 'MEDIUM',
  assigneeId: '',
  dueDate: '',
};

const SELECT_BASE = cn(
  'w-full text-sm bg-[var(--surface-overlay)] text-[var(--text-primary)] px-3.5 py-2.5',
  'border border-[var(--border)] rounded-[var(--radius-md)] outline-none',
  'transition-all duration-[var(--ease-base)]',
  'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20',
  'disabled:opacity-50 disabled:cursor-not-allowed appearance-none'
);

const CreateTaskModal = ({ isOpen, onClose, projectId, sprintId, onTaskCreated }) => {
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [epics, setEpics] = useState([]);
  const [epicsLoading, setEpicsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch project members and epics when modal opens
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

    const fetchEpics = async () => {
      setEpicsLoading(true);
      try {
        const res = await API.get(`/tasks?projectId=${projectId}&type=EPIC`);
        setEpics(res.data);
      } catch {
        setEpics([]);
      } finally {
        setEpicsLoading(false);
      }
    };

    fetchMembers();
    fetchEpics();
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
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        sprintId: sprintId || null,
        type: formData.type || 'TASK',
        epicId: formData.epicId || null,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Task" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <Input
          label={<>Title <span className="text-red-400">*</span></>}
          id="create-task-title"
          placeholder="What needs to be done?"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
          disabled={submitting}
        />

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
          <div className="border border-[var(--border)] rounded-[var(--radius-md)] overflow-hidden">
            <MarkdownEditor
              value={formData.description}
              onChange={(val) => handleChange('description', val)}
              placeholder="Add more details... (Markdown supported)"
              minHeight="120px"
            />
          </div>
        </div>

        {/* Type + Epic Link */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Issue Type</label>
            <select
              className={SELECT_BASE}
              value={formData.type}
              onChange={(e) => {
                 handleChange('type', e.target.value);
                 if (e.target.value === 'EPIC') handleChange('epicId', '');
              }}
              disabled={submitting}
            >
              <option value="TASK">Task</option>
              <option value="STORY">Story</option>
              <option value="BUG">Bug</option>
              <option value="EPIC">Epic</option>
            </select>
            <span className="absolute right-3 top-[34px] pointer-events-none text-[var(--text-muted)] text-xs">▼</span>
          </div>
          {formData.type !== 'EPIC' && (
            <div className="flex-1 relative">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Epic Link {epicsLoading && <span className="text-[var(--text-muted)] ml-1">(...)</span>}
              </label>
              <select
                className={SELECT_BASE}
                value={formData.epicId}
                onChange={(e) => handleChange('epicId', e.target.value)}
                disabled={epicsLoading || submitting}
              >
                <option value="">— None —</option>
                {epics.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
              <span className="absolute right-3 top-[34px] pointer-events-none text-[var(--text-muted)] text-xs">▼</span>
            </div>
          )}
        </div>

        {/* Status + Priority */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Status</label>
            <select
              className={SELECT_BASE}
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={submitting}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
            <span className="absolute right-3 top-[34px] pointer-events-none text-[var(--text-muted)] text-xs">▼</span>
          </div>
          <div className="flex-1 relative">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Priority</label>
            <select
              className={SELECT_BASE}
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              disabled={submitting}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <span className="absolute right-3 top-[34px] pointer-events-none text-[var(--text-muted)] text-xs">▼</span>
          </div>
        </div>

        {/* Assignee + Due Date */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Assignee {membersLoading && <span className="text-[var(--text-muted)] ml-1">(...)</span>}
            </label>
            <select
              className={SELECT_BASE}
              value={formData.assigneeId}
              onChange={(e) => handleChange('assigneeId', e.target.value)}
              disabled={membersLoading || submitting}
            >
              <option value="">— Unassigned —</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name} ({m.role})
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-[34px] pointer-events-none text-[var(--text-muted)] text-xs">▼</span>
          </div>
          <div className="flex-1">
            <Input
              label="Due Date"
              id="create-task-due"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-xs px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)]">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={submitting}>
            {submitting ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;