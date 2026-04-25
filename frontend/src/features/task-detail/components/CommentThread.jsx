import { Send, Trash2, MessageSquare } from 'lucide-react';
import { Skeleton } from '../../../design-system/Skeleton';
import { Button } from '../../../design-system/Button';
import { cn } from '../../../design-system/utils';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b'];

const Avatar = ({ name, size = 'sm' }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const bg = COLORS[initials.charCodeAt(0) % COLORS.length];
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm';
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold text-white shrink-0', dim)} style={{ background: bg }}>
      {initials}
    </div>
  );
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

export const CommentThread = ({ comments, loading, currentUserId, newComment, setNewComment, onPost, onDelete, posting }) => (
  <div className="flex flex-col gap-5">
    {/* Comment List */}
    {loading ? (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton width="28px" height="28px" rounded="full" className="shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton width="100px" height="12px" />
              <Skeleton width="80%" height="12px" />
            </div>
          </div>
        ))}
      </div>
    ) : comments.length === 0 ? (
      <div className="flex flex-col items-center py-8 text-center">
        <MessageSquare size={20} className="mb-2 opacity-30" style={{ color: 'var(--text-muted)' }} />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No comments yet. Be the first!</p>
      </div>
    ) : (
      <div className="space-y-5">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3 group">
            <Avatar name={comment.author?.name} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {comment.author?.name || 'Unknown'}
                </span>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--text-secondary)' }}>
                {comment.body}
              </p>
            </div>
            {comment.author?.id === currentUserId && (
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1.5 rounded-[var(--radius-sm)] opacity-0 group-hover:opacity-100 transition-all duration-[var(--ease-base)]"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                title="Delete comment"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    )}

    {/* Composer */}
    <form onSubmit={onPost} className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
      <input
        type="text"
        value={newComment}
        onChange={e => setNewComment(e.target.value)}
        placeholder="Leave a comment..."
        className="flex-1 h-9 px-3.5 text-sm rounded-[var(--radius-md)] outline-none transition-all duration-[var(--ease-base)]"
        style={{
          background: 'var(--surface-overlay)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
      />
      <Button
        type="submit"
        variant="primary"
        size="sm"
        icon={<Send size={13} />}
        loading={posting}
        disabled={!newComment.trim() || posting}
      >
        Post
      </Button>
    </form>
  </div>
);

export default CommentThread;
