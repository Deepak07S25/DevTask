import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import API from '../api/axios';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input, Textarea } from '../design-system/Input';

const EditProjectModal = ({ isOpen, onClose, project, onProjectUpdated }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) { setFormData({ name: project.name || '', description: project.description || '' }); setError(''); }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Project name is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await API.patch(`/projects/${project.id}`, formData);
      onProjectUpdated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update project');
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-xs px-3 py-2.5 rounded-[var(--radius-md)]"
            style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }}>
            {error}
          </div>
        )}
        <Input
          label="Project Name"
          id="edit-proj-name"
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={loading}
        />
        <Textarea
          label="Description"
          id="edit-proj-desc"
          rows={3}
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          disabled={loading}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="md" type="button" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" loading={loading} icon={!loading ? <Save size={13} /> : undefined}>
            {loading ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProjectModal;
