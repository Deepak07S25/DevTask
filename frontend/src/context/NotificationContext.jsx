/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data } = await API.get('/notifications?limit=100');
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        
        fetchNotifications();
        
        const baseURL = API.defaults.baseURL ? API.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';
        
        // Production stability configuration
        const socket = io(baseURL, { 
            withCredentials: true,
            reconnection: true,             // Auto-reconnect if network drops
            reconnectionAttempts: 10,       // Try 10 times before giving up
            reconnectionDelay: 2000,        // Wait 2s between tries
            transports: ['websocket', 'polling'] // Try WebSocket first, fallback to polling
        });

        socket.on('new_notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        const interval = setInterval(fetchNotifications, 120000); // 2 min polling

        return () => {
            socket.disconnect();
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const markAsRead = async (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await API.patch(`/notifications/${id}/read`);
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        try {
            await API.put('/notifications/read-all');
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNotification = async (id) => {
        const deleted = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (deleted && !deleted.read) setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await API.delete(`/notifications/${id}`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            deleteNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
