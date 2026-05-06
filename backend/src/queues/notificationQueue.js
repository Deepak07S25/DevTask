const EventEmitter = require('events');

// Import our existing handlers
const { handleTaskAssigned, handleTaskUpdated } = require('../workers/handlers/task.handler');
const { handleProjectAssigned } = require('../workers/handlers/project.handler');
const { handleCommentAdded } = require('../workers/handlers/comment.handler');

class NotificationEmitter extends EventEmitter {}
const notificationEmitter = new NotificationEmitter();

// Safely wrap execution with exponential backoff retries (Production Stability)
const executeHandler = async (handler, payload, eventType, attempt = 1) => {
    try {
        await handler(payload);
        console.log(`✅ [Notification Success] Created ${eventType} for User ${payload.recipientId}`);
    } catch (error) {
        console.error(`❌ [Event Error] Failed to process ${eventType} (Attempt ${attempt}):`, error.message);
        
        if (attempt < 3) {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
            console.log(`⏳ Retrying ${eventType} in ${delay}ms...`);
            setTimeout(() => executeHandler(handler, payload, eventType, attempt + 1), delay);
        } else {
            console.error(`🚨 [Event Failed] Exhausted all retries for ${eventType}`, payload);
            // In a strict production system, you would save this payload to a Dead Letter Queue table here.
        }
    }
};

// Register listeners
notificationEmitter.on('TASK_ASSIGNED', (payload) => executeHandler(handleTaskAssigned, payload, 'TASK_ASSIGNED'));
notificationEmitter.on('TASK_UPDATED', (payload) => executeHandler(handleTaskUpdated, payload, 'TASK_UPDATED'));
notificationEmitter.on('COMMENT_ADDED', (payload) => executeHandler(handleCommentAdded, payload, 'COMMENT_ADDED'));
notificationEmitter.on('PROJECT_ASSIGNED', (payload) => executeHandler(handleProjectAssigned, payload, 'PROJECT_ASSIGNED'));

/**
 * Fires an event to process the notification asynchronously in-memory.
 * By not awaiting the emit result, the API can return to the user instantly.
 */
const enqueueNotification = async (eventType, payload) => {
    console.log(`📨 [Notification Triggered] Event: ${eventType} to User: ${payload.recipientId}`);
    notificationEmitter.emit(eventType, payload);
};

module.exports = {
    enqueueNotification
};
