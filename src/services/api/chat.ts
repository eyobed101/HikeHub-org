import axiosInstance from '../../utils/axiosInstance';

export interface Message {
    _id: string;
    sender: {
        _id: string;
        username: string;
        email?: string;
    };
    content: {
        text?: string;
        imagePath?: string;
    };
    chat: string;
    readBy: string[];
    createdAt: string;
    updatedAt: string;
    isOptimistic?: boolean; // Added for optimistic UI updates
    localImageUrl?: string; // For optimistic image display
}

export interface Chat {
    _id: string;
    chatName: string;
    isGroupChat: boolean;
    users: Array<{
        _id: string;
        username: string;
        email?: string;
        profilePicture?: string;
    }>;
    latestMessage?: Message;
    groupAdmin?: {
        _id: string;
        username: string;
    };
    createdAt: string;
    updatedAt: string;
    unreadCount?: number;
}

export interface PaginatedMessages {
    messages: Message[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalMessages: number;
    };
}

// Get all chats for current user
export const fetchUserChats = async (): Promise<Chat[]> => {
    const response = await axiosInstance.get<Chat[]>('/chat');
    return response.data;
};

// Get messages for a specific chat
export const getChatMessages = async (chatId: string, page: number = 1, limit: number = 15): Promise<PaginatedMessages> => {
    const response = await axiosInstance.get<PaginatedMessages>(`/message/${chatId}`, {
        params: { page, limit },
    });
    return response.data;
};

// Mark messages as read
export const markChatAsRead = async (chatId: string): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>('/message/read', { chatId });
    return response.data;
};

// Send a new message
export const sendMessage = async (chatId: string, content: string, image?: File): Promise<Message> => {
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('content', content);
    if (image) {
        formData.append('image', image);
    }

    const response = await axiosInstance.post<Message>('/message', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Delete a message
export const deleteMessage = async (messageId: string, chatId: string): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>('/message/delete', {
        messageId,
        chatId,
    });
    return response.data;
};

// Access or create one-on-one chat
export const accessChat = async (userId: string): Promise<Chat> => {
    const response = await axiosInstance.post<Chat>('/chat', { userId });
    return response.data;
};

// Create group chat
export const createGroupChat = async (name: string, users: string[]): Promise<Chat> => {
    const response = await axiosInstance.post<Chat>('/chat/group', {
        name,
        users: users,
    });
    return response.data;
};

export const addUserToGroup = async (chatId: string, userId: string): Promise<Chat> => {
    const response = await axiosInstance.put<Chat>('/chat/groupadd', { chatId, userId });
    return response.data;
};

export const removeUserFromGroup = async (chatId: string, userId: string): Promise<Chat> => {
    const response = await axiosInstance.put<Chat>('/chat/groupremove', { chatId, userId });
    return response.data;
};

export const leaveGroup = async (chatId: string): Promise<Chat> => {
    const response = await axiosInstance.put<Chat>('/chat/groupleave', { chatId });
    return response.data;
};

export const deleteGroup = async (chatId: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete<{ message: string }>('/chat/group', { data: { chatId } });
    return response.data;
};

// Search Users (Added based on usage in ChatList)
export interface SearchUserResult {
    _id: string;
    username: string;
    firstname: string;
    lastname: string;
    profilePicture?: string;
}

export const searchUsers = async (search: string, limit: number = 10): Promise<SearchUserResult[]> => {
    const response = await axiosInstance.get<SearchUserResult[]>('/user', {
        params: { search, limit }
    });
    return response.data;
};
