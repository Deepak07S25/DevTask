import { useState, useEffect } from 'react';
import { X, Edit2, Save, Trash2, MessageSquare, History, CheckSquare, Bookmark, Bug, Layers, Sparkles } from 'lucide-react';
import API from '../api/axios';
import ActivityTimeline from './ActivityTimeline';
import MarkdownEditor, { MarkdownContent } from './MarkdownEditor';
import { Badge, StatusBadge } from '../design-system/Badge';
import { RiskBadge } from '../design-system/RiskBadge';
import { Button } from '../design-system/Button';
import { IconButton } from '../design-system/IconButton';
import { CommentThread } from '../features/task-detail/components/CommentThread';
import { TaskMetaView, TaskMetaEdit } from '../features/task-detail/components/TaskMetaSection';
import { cn } from '../design-system/utils';
import { useToast } from '../design-system/Toast';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const getLoggedInUserId = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1])).userId;
  } catch { return null; }
};

const PRIORITY_VARIANT = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' };
const TYPE_ICONS = {
  EPIC:  <Layers size={14} className="text-purple-400" />,
  STORY: <Bookmark size={14} className="text-emerald-400" />,
  BUG:   <Bug size={14} className="text-red-400" />,
  TASK:  <CheckSquare size={14} className="text-sky-400" />,
};

const TAB_BTN = (active) => cn(
  'flex items-center gap-1.5 pb-3 text-xs font-semibold border-b-2 transition-all duration-[var(--ease-base)]',
  active
    ? 'border-blue-500 text-[var(--text-primary)]'
    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
);

/* ── Component ────────────────────────────────────────────────────────────── */
const TaskDetailModal = ({ task, isOpen, onClose, onTaskUpdated, onTaskDeleted, projectId, onAskAi }) => {
  const [isEditing, setIsEditing]       = useState(false);
  const [loading, setLoading]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab]       = useState('comments');
  const { success, error: toastError }  = useToast();

  const [formData, setFormData] = useState({
    title: '', description: '', type: 'TASK', epicId: '',
    status: 'TODO', priority: 'MEDIUM', dueDate: '', assigneeId: '',
  });

  const [members, setMembers] = useState([]);
  const [epics,   setEpics]   = useState([]);
  const [columns, setColumns] = useState([]);

  const [comments,        setComments]        = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment,      setNewComment]      = useState('');
  const [postingComment,  setPostingComment]  = useState(false);

  const [insights,        setInsights]        = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const currentUserId = getLoggedInUserId();

  useEffect(() => {
    if (!isOpen || !task) return;
    
    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        const res = await API.get(`/tasks/${task.id}/comments`);
        setComments(res.data);
      } catch { /* silent */ } finally { setCommentsLoading(false); }
    };

    setFormData({
      title:      task.title,
      description:task.description || '',
      type:       task.type || 'TASK',
      epicId:     task.epicId || '',
      status:     task.status,
      priority:   task.priority,
      dueDate:    task.dueDate ? task.dueDate.split('T')[0] : '',
      assigneeId: task.assigneeId || '',
    });
    setIsEditing(false);
    setConfirmDelete(false);
    setActiveTab('comments');
    setInsights(null);
    fetchComments();
    if (projectId) {
      API.get(`/projects/${projectId}/members`).then(r => setMembers(r.data)).catch(() => setMembers([]));
      API.get(`/tasks?projectId=${projectId}&type=EPIC`).then(r => setEpics(r.data)).catch(() => setEpics([]));
      API.get(`/projects/${projectId}/columns`).then(r => setColumns(r.data)).catch(() => setColumns([]));
    }
  }, [task, isOpen, projectId]);

  if (!isOpen || !task) return null;

  const handleChange = (field, value) => setFormData(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        dueDate:    formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        assigneeId: formData.assigneeId || null,
        epicId:     formData.type === 'EPIC' ? null : (formData.epicId || null),
      };
      const res = await API.patch(`/tasks/${task.id}`, payload);
      onTaskUpdated(res.data);
      setIsEditing(false);
      success('Task updated');
    } catch { toastError('Failed to update task'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await API.delete(`/tasks/${task.id}`);
      onTaskDeleted(task.id);
      onClose();
      success('Task deleted');
    } catch { toastError('Failed to delete task'); }
    finally { setLoading(false); }
  };

  const handleCancel = () => {
    setFormData({
      title: task.title, description: task.description || '', type: task.type || 'TASK',
      epicId: task.epicId || '', status: task.status, priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', assigneeId: task.assigneeId || '',
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
      setComments(p => [...p, res.data]);
      setNewComment('');
    } catch { toastError('Failed to post comment'); }
    finally { setPostingComment(false); }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await API.delete(`/tasks/${task.id}/comments/${commentId}`);
      setComments(p => p.filter(c => c.id !== commentId));
      success('Comment deleted');
    } catch { toastError('Failed to delete comment'); }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-3xl flex flex-col rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden"
        style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', maxHeight: '90vh' }}
      >
        {/* ── TOP HEADER ─────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4 px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* Type icon */}
          <span className="mt-1 shrink-0">{TYPE_ICONS[isEditing ? formData.type : (task.type || 'TASK')]}</span>

          {/* Title area */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                className="w-full text-lg font-bold bg-transparent outline-none border-b pb-1 transition-colors"
                style={{
                  color: 'var(--text-primary)',
                  borderColor: 'var(--accent)',
                  caretColor: 'var(--accent)',
                }}
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                autoFocus
              />
            ) : (
              <h2 className="text-lg font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {task.title}
              </h2>
            )}

            {/* Badges row — shown in view mode */}
            {!isEditing && (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={PRIORITY_VARIANT[task.priority] || 'default'}>{task.priority}</Badge>
                <StatusBadge status={task.status} />
                <Badge variant="default">{task.type || 'TASK'}</Badge>
                {task.epic && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[var(--radius-xs)]"
                    style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                    {task.epic.title}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {task.blocked && onAskAi && !isEditing && (
              <Button
                variant="secondary"
                size="sm"
                className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                icon={<Sparkles size={13} className="text-amber-400" />}
                onClick={() => onAskAi(task, "Why is this task blocked and what is needed to unblock it?")}
              >
                Analyze why blocked
              </Button>
            )}
            {onAskAi && !isEditing && (
              <Button
                variant="secondary"
                size="sm"
                className="text-[var(--ai-accent,#8b5cf6)] border-[var(--ai-border,rgba(139,92,246,0.25))] hover:bg-[var(--ai-bg-subtle,rgba(139,92,246,0.1))]"
                icon={<Sparkles size={13} style={{ color: 'var(--ai-accent-text, #a78bfa)' }} />}
                onClick={() => onAskAi(task)}
              >
                Ask AI
              </Button>
            )}
            {!isEditing && !confirmDelete && (
              <Button variant="secondary" size="sm" icon={<Edit2 size={13} />} onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
            <IconButton icon={<X size={16} />} variant="ghost" size="md" onClick={onClose} label="Close" />
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — Content */}
          <div className="flex-1 flex flex-col overflow-y-auto px-6 py-5 gap-6 min-w-0">

            {/* Description */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
                Description
              </p>
              {isEditing ? (
                <MarkdownEditor
                  value={formData.description}
                  onChange={val => handleChange('description', val)}
                  placeholder="Add a description... (Markdown supported)"
                  minHeight="140px"
                />
              ) : task.description ? (
                <div className="text-sm">
                  <MarkdownContent content={task.description} />
                </div>
              ) : (
                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                  No description. Click Edit to add one.
                </p>
              )}
            </div>

            {/* Comments + Activity (view mode only) */}
            {!isEditing && (
              <div>
                {/* Tab Bar */}
                <div className="flex gap-6 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <button onClick={() => setActiveTab('comments')} className={TAB_BTN(activeTab === 'comments')}>
                    <MessageSquare size={13} />
                    Comments
                    {comments.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-[var(--radius-xs)] text-[10px]"
                        style={{ background: 'var(--surface-subtle)', color: 'var(--text-muted)' }}>
                        {comments.length}
                      </span>
                    )}
                  </button>
                  <button onClick={() => setActiveTab('activity')} className={TAB_BTN(activeTab === 'activity')}>
                    <History size={13} /> Activity
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('insights');
                      if (!insights && !insightsLoading) {
                        setInsightsLoading(true);
                        API.get(`/tasks/${task.id}/ai/insights`)
                           .then(r => setInsights(r.data.data))
                           .catch(() => {})
                           .finally(() => setInsightsLoading(false));
                      }
                    }} 
                    className={TAB_BTN(activeTab === 'insights')}
                  >
                    <Sparkles size={13} className="text-purple-400" /> AI Insights
                  </button>
                </div>

                {activeTab === 'comments' ? (
                  <CommentThread
                    comments={comments}
                    loading={commentsLoading}
                    currentUserId={currentUserId}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    onPost={handlePostComment}
                    onDelete={handleDeleteComment}
                    posting={postingComment}
                  />
                ) : activeTab === 'activity' ? (
                  <ActivityTimeline taskId={task.id} />
                ) : (
                  <div className="text-sm">
                    {insightsLoading ? (
                      <p className="text-purple-400 animate-pulse flex items-center gap-2"><Sparkles size={14}/> Generating AI insights...</p>
                    ) : insights ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <RiskBadge level={insights.riskLevel} />
                          <span className="text-xs text-[var(--text-muted)]">Risk Score: {insights.riskScore}</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-[var(--text-secondary)]">
                          {insights.insights.map((msg, i) => <li key={i}>{msg}</li>)}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-[var(--text-muted)]">Could not load AI insights.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Edit mode footer actions */}
            {isEditing && (
              <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <Button variant="ghost" size="md" onClick={handleCancel} disabled={loading}>Cancel</Button>
                <Button variant="primary" size="md" loading={loading} icon={!loading ? <Save size={14} /> : undefined} onClick={handleSave}>
                  {loading ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          {/* RIGHT — Metadata panel */}
          <div
            className="w-56 shrink-0 flex flex-col overflow-y-auto"
            style={{ borderLeft: '1px solid var(--border)', background: 'var(--surface-base)' }}
          >
            <div className="p-4 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                Details
              </p>

              {isEditing ? (
                <TaskMetaEdit formData={formData} onChange={handleChange} members={members} epics={epics} columns={columns} />
              ) : (
                <TaskMetaView task={task} />
              )}
            </div>

            {/* Delete section (view mode, not editing) */}
            {!isEditing && (
              <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
                {confirmDelete ? (
                  <div className="space-y-2">
                    <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                      This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} className="flex-1">No</Button>
                      <Button variant="danger" size="sm" loading={loading} onClick={handleDelete} className="flex-1">
                        {loading ? '...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-[var(--radius-md)] transition-all duration-[var(--ease-base)]"
                    style={{ color: 'var(--danger)', border: '1px solid var(--danger-border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Trash2 size={13} /> Delete Task
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
