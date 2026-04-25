import { useState } from 'react';
import API from '../api/axios';
import { Modal } from '../design-system/Modal';
import { Button } from '../design-system/Button';
import { Input, Textarea } from '../design-system/Input';

/** Derives a valid project key from a name: uppercase, alphanumeric, max 10 chars */
const deriveKey = (name) =>
  name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [name, setName]               = useState('');
  const [key, setKey]                 = useState('');
  const [description, setDescription] = useState('');
  const [keyEdited, setKeyEdited]     = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    // Auto-fill key only if user hasn't manually edited it
    if (!keyEdited) setKey(deriveKey(val));
  };

  const handleKeyChange = (e) => {
    setKeyEdited(true);
    setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
  };

  const handleClose = () => {
    setName(''); setKey(''); setDescription(''); setKeyEdited(false); setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key || key.length < 2) {
      setError('Project key must be at least 2 uppercase letters/numbers.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/projects', { name, key, description });
      onProjectCreated(res.data);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.issues?.[0]?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Project">
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
          value={name}
          onChange={handleNameChange}
          required
          disabled={loading}
        />
        <Input
          label="Project Key"
          id="create-proj-key"
          type="text"
          placeholder="e.g. CPV2"
          value={key}
          onChange={handleKeyChange}
          required
          disabled={loading}
          hint="2–10 uppercase letters/numbers. Used to prefix task IDs."
        />
        <Textarea
          label="Description"
          id="create-proj-desc"
          placeholder="What is this project about?"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={loading}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="md" type="button" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" size="md" type="submit" loading={loading}>
            {loading ? 'Creating…' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;