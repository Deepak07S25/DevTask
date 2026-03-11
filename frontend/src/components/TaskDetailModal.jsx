import { useState, useEffect } from 'react';
import { X, Trash2, Save, Edit2, Send, MessageSquare, History } from 'lucide-react';
import API from '../api/axios';
import ActivityTimeline from './ActivityTimeline';

const PRIORITY_STYLES = {
  HIGH: 'bg-red-900/50 text-red-400 border-red-800',
  MEDIUM: 'bg-amber-900/50 text-amber-400 border-amber-800',
  LOW: 'bg-green-900/50 text-green-400 border-green-800',
};

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

// Get logged-in user ID from JWT stored in localStorage
const getLoggedInUserId = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId;
  } catch {
    return null;
  }
};

const Avatar = ({ name }) => {
  const initials = name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const colors = ['bg-sky-600', 'bg-violet-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
};

const TaskDetailModal = ({ task, isOpen, onClose, onTaskUpdated, onTaskDeleted, projectId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    type: task?.type || 'TASK',
    epicId: task?.epicId || '',
    status: task?.status || 'TODO',
    priority: task?.priority || 'MEDIUM',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    assigneeId: task?.assigneeId || '',
  });

  const [activeTab, setActiveTab] = useState('comments');

  // Members for assignee picker
  const [members, setMembers] = useState([]);
  const [epics, setEpics] = useState([]);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const currentUserId = getLoggedInUserId();

  useEffect(() => {
    if (!isOpen || !task) return;
    setFormData({
      title: task.title,
      description: task.description || '',
      type: task.type || 'TASK',
      epicId: task.epicId || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assigneeId: task.assigneeId || '',
    });
    setIsEditing(false);
    setConfirmDelete(false);
    fetchComments();
    // Fetch members and epics
    if (projectId) {
      API.get(`/projects/${projectId}/members`)
        .then((res) => setMembers(res.data))
        .catch(() => setMembers([]));
      API.get(`/tasks?projectId=${projectId}&type=EPIC`)
        .then((res) => setEpics(res.data))
        .catch(() => setEpics([]));
    }
  }, [task?.id, isOpen]);

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await API.get(`/tasks/${task.id}/comments`);
      setComments(res.data);
    } catch {
      // silently fail
    } finally {
      setCommentsLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        dueDate: formData.dueDate || null,
        assigneeId: formData.assigneeId || null,
        epicId: formData.type === 'EPIC' ? null : (formData.epicId || null),
      };
      const res = await API.patch(`/tasks/${task.id}`, payload);
      onTaskUpdated(res.data);
      setIsEditing(false);
    } catch {
      alert('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await API.delete(`/tasks/${task.id}`);
      onTaskDeleted(task.id);
      onClose();
    } catch {
      alert('Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: task.title,
      description: task.description || '',
      type: task.type || 'TASK',
      epicId: task.epicId || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assigneeId: task.assigneeId || '',
    });
    setIsEditing(false);
    setConfirmDelete(false);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPostingComment(true);
    try {
      const res = await API.post(`/tasks/${task.id}/comments`, { body: newComment.trim() });
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
    } catch {
      alert('Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/tasks/${task.id}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      alert('Failed to delete comment');
    }
  };

  const formatRelativeTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-800 flex-shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${PRIORITY_STYLES[isEditing ? formData.priority : task.priority]}`}>
            {isEditing ? formData.priority : task.priority}
          </span>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="p-2 text-zinc-400 hover:text-sky-400 hover:bg-zinc-800 rounded-lg transition" title="Edit task">
                <Edit2 size={17} />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-5">

            {/* Title */}
            {isEditing ? (
              <input
                className="w-full text-xl font-bold bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:border-sky-500 outline-none"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            ) : (
              <h2 className="text-xl font-bold text-white">{task.title}</h2>
            )}

            {/* Status + Priority selects (edit mode) */}
            {isEditing && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Issue Type</label>
                  <select className="w-full p-2.5 bg-zinc-800 rounded-lg border border-zinc-700 text-white outline-none focus:border-sky-500" value={formData.type} onChange={(e) => {
                     handleChange('type', e.target.value);
                     if (e.target.value === 'EPIC') handleChange('epicId', '');
                  }}>
                    <option value="TASK">🟦 Task</option>
                    <option value="STORY">🟩 Story</option>
                    <option value="BUG">🟥 Bug</option>
                    <option value="EPIC">🟪 Epic</option>
                  </select>
                </div>
                {formData.type !== 'EPIC' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Epic Link</label>
                    <select className="w-full p-2.5 bg-zinc-800 rounded-lg border border-zinc-700 text-white outline-none focus:border-sky-500" value={formData.epicId} onChange={(e) => handleChange('epicId', e.target.value)}>
                      <option value="">— None —</option>
                      {epics.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Status</label>
                  <select className="w-full p-2.5 bg-zinc-800 rounded-lg border border-zinc-700 text-white outline-none focus:border-sky-500" value={formData.status} onChange={(e) => handleChange('status', e.target.value)}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Priority</label>
                  <select className="w-full p-2.5 bg-zinc-800 rounded-lg border border-zinc-700 text-white outline-none focus:border-sky-500" value={formData.priority} onChange={(e) => handleChange('priority', e.target.value)}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
            )}

            {/* Properties badge (view mode) */}
            {!isEditing && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Type:</span>
                  <span className="text-xs font-bold text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-full">{task.type || 'TASK'}</span>
                </div>
                {task.epic && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500">Epic:</span>
                    <span className="text-xs font-bold text-purple-300 bg-purple-900/40 border border-purple-800/50 px-2.5 py-1 rounded-full">{task.epic.title}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">Status:</span>
                  <span className="text-xs font-bold text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-full">{STATUS_LABELS[task.status]}</span>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
              {isEditing ? (
                <textarea rows={3} className="w-full p-3 bg-zinc-800 rounded-lg border border-zinc-700 text-white focus:border-sky-500 outline-none resize-none" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Add a description..." />
              ) : (
                <p className="text-zinc-400 text-sm leading-relaxed min-h-[40px]">
                  {task.description || <span className="italic text-zinc-600">No description</span>}
                </p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Due Date</label>
              {isEditing ? (
                <input type="date" className="p-2.5 bg-zinc-800 rounded-lg border border-zinc-700 text-white focus:border-sky-500 outline-none" value={formData.dueDate} onChange={(e) => handleChange('dueDate', e.target.value)} />
              ) : (
                <p className={`text-sm font-medium ${task.dueDate ? (new Date(task.dueDate) < new Date() ? 'text-red-400' : 'text-zinc-300') : 'text-zinc-600 italic'}`}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No due date'}
                </p>
              )}
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Assignee</label>
              {isEditing ? (
                <select
                  className="w-full p-2.5 bg-zinc-800 rounded-lg border border-zinc-700 text-white outline-none focus:border-sky-500"
                  value={formData.assigneeId}
                  onChange={(e) => handleChange('assigneeId', e.target.value)}
                >
                  <option value="">— Unassigned —</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  {task.assignee ? (
                    <>
                      <Avatar name={task.assignee.name} />
                      <span className="text-sm text-zinc-300 font-medium">{task.assignee.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-zinc-600 italic">Unassigned</span>
                  )}
                </div>
              )}
            </div>

            {/* ── Tabs Section ── */}
            {!isEditing && (
              <div className="pt-2 border-t border-zinc-800">
                <div className="flex gap-6 mb-4 border-b border-zinc-800">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${activeTab === 'comments' ? 'border-sky-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <MessageSquare size={15} />
                    Comments <span className="text-xs font-normal bg-zinc-800 px-1.5 py-0.5 rounded-full">{comments.length}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${activeTab === 'activity' ? 'border-sky-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <History size={15} />
                    Activity
                  </button>
                </div>

                {activeTab === 'comments' ? (
                  <>
                    <div className="space-y-4 mb-4">
                      {commentsLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : comments.length === 0 ? (
                        <p className="text-zinc-600 text-sm italic text-center py-4">No comments yet. Be the first!</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar name={comment.author?.name} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-xs font-bold text-zinc-300">{comment.author?.name || 'Unknown'}</span>
                                <span className="text-[11px] text-zinc-600">{formatRelativeTime(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm text-zinc-400 leading-relaxed break-words">{comment.body}</p>
                            </div>
                            {comment.author?.id === currentUserId && (
                              <button onClick={() => handleDeleteComment(comment.id)} className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition flex-shrink-0 self-start" title="Delete comment">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <form onSubmit={handlePostComment} className="flex gap-2">
                      <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-sky-500 outline-none placeholder-zinc-600" />
                      <button type="submit" disabled={postingComment || !newComment.trim()} className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition disabled:opacity-40 flex items-center gap-1.5 text-sm font-medium">
                        <Send size={14} />
                        {postingComment ? '...' : 'Post'}
                      </button>
                    </form>
                  </>
                ) : (
                  <ActivityTimeline taskId={task.id} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="p-5 border-t border-zinc-800 flex-shrink-0">
          {isEditing ? (
            <div className="flex gap-3">
              <button onClick={handleCancel} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition font-medium">Cancel</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-2 disabled:opacity-50">
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : confirmDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400 text-center">Are you sure? This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition font-medium">Cancel</button>
                <button onClick={handleDelete} disabled={loading} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition disabled:opacity-50">
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="w-full py-2.5 rounded-lg border border-red-900/50 text-red-400 hover:bg-red-900/20 hover:border-red-700 transition font-medium flex items-center justify-center gap-2">
              <Trash2 size={16} /> Delete Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
