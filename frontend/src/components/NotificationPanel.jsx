import { useState, useEffect, useRef, useContext } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';

const NotificationPanel = () => {
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useContext(NotificationContext);
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const handleRead = async (id, link) => {
        await markAsRead(id);
        if (link) {
            setOpen(false);
            navigate(link);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        await deleteNotification(id);
    };



    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-overlay)] hover:text-[var(--text-primary)] transition-colors"
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-[var(--surface-raised)]"></span>
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 max-h-[32rem] flex flex-col bg-[var(--surface-raised)] border border-[var(--border)] rounded-lg shadow-2xl z-50 overflow-hidden" style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)' }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-overlay)]">
                        <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                            Notifications
                            {unreadCount > 0 && (
                                <span className="bg-[var(--accent)] text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                            )}
                        </h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-[var(--accent)] hover:text-[var(--accent-glow)] flex items-center gap-1 transition-colors"
                                    title="Mark all as read"
                                >
                                    <Check size={14} /> Read all
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loading && notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-[var(--text-muted)]">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 flex flex-col items-center justify-center text-center text-[var(--text-muted)]">
                                <Bell size={32} className="mb-3 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleRead(notification.id, notification.link)}
                                    className={`relative p-3 rounded-md cursor-pointer transition-colors group flex gap-3 ${
                                        notification.read ? 'bg-transparent hover:bg-[var(--surface-overlay)]' : 'bg-[var(--surface-overlay)] hover:bg-[var(--surface-overlay-hover)] border-l-2 border-[var(--accent)]'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${notification.read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)] font-medium'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-[var(--text-muted)] mt-1.5 opacity-60">
                                            {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(notification.id, e)}
                                        className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 p-1.5 rounded-md transition-all self-start"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
