import io, { Socket } from 'socket.io-client';
import type { Message } from '../api/chat';

// Define Notification types inline to avoid dependency issues if types/api.ts is missing
export interface Notification {
    _id: string;
    recipient: string;
    sender: {
        _id: string;
        username: string;
        profilePicture?: string;
    };
    type: 'FRIEND_REQUEST' | 'GROUP_INVITE' | 'EVENT_INVITE' | 'GENERAL';
    content: string;
    relatedId?: string;
    isRead: boolean;
    createdAt: string;
}

export interface EventNotification {
    _id: string;
    message: string;
    // Add other fields as needed
}

class ChatSocketService {
    private socket: Socket | null = null;

    connect(userId: string) {
        if (this.socket) return;

        // Use relative path to leverage Vite proxy
        const ENDPOINT = "";
        this.socket = io(ENDPOINT, {
            transports: ['websocket'],
        });

        this.socket.emit('setup', { _id: userId });

        this.socket.on('connected', () => {
            console.log('Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinChat(chatId: string) {
        if (this.socket) {
            this.socket.emit('join chat', chatId);
        }
    }

    sendMessage(messageData: Record<string, unknown>) {
        if (this.socket) {
            this.socket.emit('new message', messageData);
        }
    }

    onMessageReceived(callback: (message: Message) => void) {
        if (this.socket) {
            this.socket.on('message received', callback);
        }
    }

    onNewNotification(callback: (notification: Notification) => void) {
        if (this.socket) {
            this.socket.on('new_notification', callback);
        }
    }

    onNewEventNotification(callback: (notification: EventNotification) => void) {
        if (this.socket) {
            this.socket.on('new_event_notification', callback);
        }
    }

    markMessageAsRead(messageId: string, chatId: string) {
        if (this.socket) {
            this.socket.emit('mark as read', { messageId, chatId });
        }
    }

    onMessageUpdated(callback: (message: Message) => void) {
        if (this.socket) {
            this.socket.on('message updated', callback);
        }
    }

    onTyping(callback: (chatId: string) => void) {
        if (this.socket) {
            this.socket.on('typing', callback);
        }
    }

    onStopTyping(callback: (chatId: string) => void) {
        if (this.socket) {
            this.socket.on('stop typing', callback);
        }
    }

    emitTyping(chatId: string) {
        if (this.socket) {
            this.socket.emit('typing', chatId);
        }
    }

    emitStopTyping(chatId: string) {
        if (this.socket) {
            this.socket.emit('stop typing', chatId);
        }
    }

    emit(event: string, data: any) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    onUserOnline(callback: (userId: string) => void) {
        if (this.socket) {
            this.socket.on('user online', callback);
        }
    }

    onUserOffline(callback: (userId: string) => void) {
        if (this.socket) {
            this.socket.on('user offline', callback);
        }
    }

    removeAllListeners() {
        if (this.socket) {
            this.socket.removeAllListeners();
        }
    }
}

export const chatSocketService = new ChatSocketService();
