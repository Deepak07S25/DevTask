import { useState } from 'react';
import { X } from 'lucide-react';
import API from '../api/axios';

const CreateProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post('/projects', formData); // Backend call
      onProjectCreated(res.data); // Update the dashboard list
      onClose(); // Close modal
      setFormData({ name: '', description: '' });
    } catch (err) {
      alert("Error creating project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">New Project</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Project Name</label>
            <input 
              type="text" required
              className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 text-white focus:border-sky-500 outline-none"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
            <textarea 
              rows="3"
              className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 text-white focus:border-sky-500 outline-none"
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;