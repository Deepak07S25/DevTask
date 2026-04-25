import { useState } from 'react';
import API from '../api/axios';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input, Textarea } from '../design-system/Input';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/projects', formData);
      onProjectCreated(res.data);
      onClose();
      setFormData({ name: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-xs px-3 py-2.5 rounded-[var(--radius-md)]"
            style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }}>
            {error}
          </div>
        )}
        <Input
          label="Project Name"
          id="create-proj-name"
          type="text"
          placeholder="e.g. Customer Portal v2"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={loading}
        />
        <Textarea
          label="Description"
          id="create-proj-desc"
          placeholder="What is this project about?"
          rows={3}
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          disabled={loading}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="md" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" loading={loading}>
            {loading ? 'Creating…' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;