const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;
// Map to track user to socket connections
// Structure: { userId: Set([socketId1, socketId2]) }
const userSockets = new Map();

const initializeSocket = (server, corsOrigin) => {
    io = new Server(server, {
        cors: {
            origin: corsOrigin,
            credentials: true
        }
    });

    // Middleware to authenticate socket connections
    io.use((socket, next) => {
        try {
            // Attempt to get token from handshake auth
            let token = socket.handshake.auth?.token;
            
            // Fallback: Check cookies if sent via browser transport
            if (!token && socket.handshake.headers.cookie) {
                const cookies = socket.handshake.headers.cookie.split(';').reduce((res, c) => {
                    const [key, val] = c.trim().split('=');
                    res[key] = val;
                    return res;
                }, {});
                token = cookies.token;
            }

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        
        // Add to map
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        console.log(`[Socket] User ${userId} connected (${socket.id})`);

        socket.on('disconnect', () => {
            const userSet = userSockets.get(userId);
            if (userSet) {
                userSet.delete(socket.id);
                if (userSet.size === 0) {
                    userSockets.delete(userId);
                }
            }
            console.log(`[Socket] User ${userId} disconnected (${socket.id})`);
        });
    });

    return io;
};

const emitNotificationToUser = (userId, notification) => {
    if (!io) {
        console.warn('[Socket] emitNotificationToUser failed: Socket server not initialized');
        return;
    }

    const userSet = userSockets.get(userId);
    if (userSet && userSet.size > 0) {
        // Emit to all active connections (tabs/devices) for this user
        userSet.forEach(socketId => {
            io.to(socketId).emit('new_notification', notification);
        });
    } else {
        // Fallback: Client relies on API polling next time they load the page
    }
};

module.exports = {
    initializeSocket,
    emitNotificationToUser
};
