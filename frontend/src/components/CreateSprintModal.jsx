import { useState } from 'react';
import { X, Target, Calendar } from 'lucide-react';

const CreateSprintModal = ({ isOpen, onClose, projectId, onSprintCreated }) => {
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

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
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });
            onSprintCreated(sprint);
            setName('');
            setGoal('');
            setStartDate('');
            setEndDate('');
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create sprint');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-zinc-800/60 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl shadow-black/40">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div>
                        <h2 className="text-lg font-bold text-white">Create Sprint</h2>
                        <p className="text-zinc-500 text-xs mt-0.5">Plan a new sprint for this project</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition p-1.5 rounded-lg hover:bg-zinc-800">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                            Sprint Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Sprint 1"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                            <Target size={12} /> Sprint Goal
                        </label>
                        <textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="What is the goal of this sprint?"
                            rows={2}
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={11} /> Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={`${inputClass} [color-scheme:dark]`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={11} /> End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={`${inputClass} [color-scheme:dark]`}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white py-2.5 rounded-xl font-medium text-sm transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50"
                        >
                            {loading ? 'Creating…' : 'Create Sprint'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSprintModal;
