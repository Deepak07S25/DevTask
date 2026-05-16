import { useState } from 'react';
import { Target, Calendar } from 'lucide-react';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input, Textarea } from '../design-system/Input';

const CreateSprintModal = ({ isOpen, onClose, projectId, onSprintCreated }) => {
  const [name,      setName]      = useState('');
  const [goal,      setGoal]      = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setName(''); setGoal(''); setStartDate(''); setEndDate(''); setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Sprint name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const { sprintApi } = await import('../api/sprintApi');
      const sprint = await sprintApi.createSprint({
        projectId,
        name: name.trim(),
        goal: goal.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      onSprintCreated(sprint);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sprint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Sprint" subtitle="Define a new planning sprint for this project">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sprint Name */}
        <Input
          label={<>Sprint Name <span className="text-red-400">*</span></>}
          id="sprint-name"
          type="text"
          placeholder="e.g. Sprint 1, MVP Launch, Bug Bash"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          disabled={loading}
          autoFocus
        />

        {/* Sprint Goal */}
        <Textarea
          label={
            <span className="flex items-center gap-1.5">
              <Target size={12} /> Sprint Goal
            </span>
          }
          id="sprint-goal"
          placeholder="What should the team achieve by the end of this sprint?"
          value={goal}
          onChange={e => setGoal(e.target.value)}
          disabled={loading}
          rows={2}
        />

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={
              <span className="flex items-center gap-1.5">
                <Calendar size={11} /> Start Date
              </span>
            }
            id="sprint-start"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            disabled={loading}
            className="[color-scheme:dark]"
          />
          <Input
            label={
              <span className="flex items-center gap-1.5">
                <Calendar size={11} /> End Date
              </span>
            }
            id="sprint-end"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            disabled={loading}
            className="[color-scheme:dark]"
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="text-xs px-3 py-2.5 rounded-[var(--radius-md)]"
            style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={loading}>
            {loading ? 'Creating…' : 'Create Sprint'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateSprintModal;
