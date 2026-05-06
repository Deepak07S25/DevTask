import { useContext } from 'react';
import { Bell, Check, Trash2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';

// Helper to group notifications by date
const groupNotifications = (notifications) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
        'Today': [],
        'Yesterday': [],
        'Older': []
    };

    notifications.forEach(notif => {
        const date = new Date(notif.createdAt);
        if (date.toDateString() === today.toDateString()) {
            groups['Today'].push(notif);
        } else if (date.toDateString() === yesterday.toDateString()) {
            groups['Yesterday'].push(notif);
        } else {
            groups['Older'].push(notif);
        }
    });

    // Remove empty groups
    return Object.fromEntries(Object.entries(groups).filter(([, items]) => items.length > 0));
};

const SkeletonItem = () => (
    <div className="p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full dt-skeleton shrink-0"></div>
        <div className="flex-1 space-y-3">
            <div className="h-4 dt-skeleton rounded w-1/3"></div>
            <div className="h-3 dt-skeleton rounded w-3/4"></div>
        </div>
    </div>
);

const NotificationsPage = () => {
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useContext(NotificationContext);
    const navigate = useNavigate();

    const handleRead = async (id, link) => {
        await markAsRead(id);
        if (link) navigate(link);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        await deleteNotification(id);
    };

    const grouped = groupNotifications(notifications);

    return (
        <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-12">
            <div className="flex items-end justify-between border-b border-[var(--border)] pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Inbox</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1 flex items-center gap-2">
                        <Clock size={14} /> Real-time activity feed
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="px-4 py-2 text-sm font-medium bg-[var(--surface-overlay)] hover:bg-[var(--surface-overlay-hover)] text-[var(--text-primary)] border border-[var(--border)] rounded-md transition-colors flex items-center gap-2"
                    >
                        <Check size={16} /> Mark all as read
                    </button>
                )}
            </div>

            {loading ? (
                <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm divide-y divide-[var(--border)]">
                    <SkeletonItem />
                    <SkeletonItem />
                    <SkeletonItem />
                </div>
            ) : notifications.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center text-[var(--text-muted)] bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl border-dashed">
                    <div className="w-16 h-16 rounded-full bg-[var(--surface-overlay)] flex items-center justify-center mb-4">
                        <Check size={32} className="opacity-50 text-[var(--accent)]" />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">Inbox Zero!</h3>
                    <p className="max-w-xs text-sm">You've caught up on everything. Enjoy the silence.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(grouped).map(([label, items]) => (
                        <div key={label} className="space-y-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] pl-1">
                                {label}
                            </h3>
                            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm divide-y divide-[var(--border)]">
                                {items.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleRead(notification.id, notification.link)}
                                        className={`relative p-4 cursor-pointer transition-colors group flex items-start gap-4 ${
                                            notification.read ? 'bg-transparent hover:bg-[var(--surface-overlay)]' : 'bg-[var(--accent-muted)] hover:bg-[var(--surface-overlay-hover)]'
                                        }`}
                                    >
                                        {!notification.read && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)]" />
                                        )}
                                        
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${notification.read ? 'bg-[var(--surface-base)] border-[var(--border)] text-[var(--text-muted)]' : 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg shadow-[var(--accent-glow)]'}`}>
                                            <Bell size={18} />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex items-start justify-between gap-4 mb-1">
                                                <p className={`text-sm leading-tight ${notification.read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)] font-semibold'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-[11px] text-[var(--text-muted)] shrink-0 whitespace-nowrap pt-0.5">
                                                    {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                            <p className={`text-sm leading-snug line-clamp-2 ${notification.read ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>
                                                {notification.message}
                                            </p>
                                        </div>
                                        
                                        <button
                                            onClick={(e) => handleDelete(notification.id, e)}
                                            className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 p-2 rounded-md transition-all self-center"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
