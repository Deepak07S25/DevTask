import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import API from '../api/axios';

const EditProjectModal = ({ isOpen, onClose, project, onProjectUpdated }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({ name: project.name || '', description: project.description || '' });
      setError('');
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Project name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await API.patch(`/projects/${project.id}`, formData);
      onProjectUpdated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">Edit Project</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Project Name</label>
            <input
              type="text" required
              className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 text-white focus:border-sky-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
            <textarea
              rows="3"
              className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 text-white focus:border-sky-500 outline-none resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={16} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
