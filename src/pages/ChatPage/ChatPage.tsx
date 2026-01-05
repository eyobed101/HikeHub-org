import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserChats, type Chat } from "../../services/api/chat";
import { chatSocketService } from "../../services/socket/chatSocket";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import { jwtDecode } from "jwt-decode";
import PageMeta from "../../components/common/PageMeta";

// Need to safely get current user from token or store
const getCurrentUser = () => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
        try {
            const decoded: any = jwtDecode(token);
            // Ensure we have properties expected by chat components
            return {
                _id: decoded.id || decoded._id,
                username: decoded.username || decoded.name || "User",
                email: decoded.email
            };
        } catch (e) {
            console.error("Failed to decode token", e);
            return null;
        }
    }
    return null;
};

export default function ChatPage() {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const currentUser = getCurrentUser();
    const queryClient = useQueryClient();

    const { data: chats, isLoading: isLoadingChats } = useQuery({
        queryKey: ["userChats"],
        queryFn: fetchUserChats,
        enabled: !!currentUser?._id,
        refetchInterval: 10000,
    });

    useEffect(() => {
        if (currentUser?._id) {
            chatSocketService.connect(currentUser._id);
        }
        return () => {
            chatSocketService.disconnect();
        };
    }, [currentUser?._id]);

    const handleChatSelect = (chat: Chat) => {
        setSelectedChat(chat);
    };

    const handleBackToChatList = () => {
        setSelectedChat(null);
    };

    if (!currentUser) {
        return <div className="p-10 text-center">Please log in to use chat.</div>;
    }

    return (
        <>
            <PageMeta title="Messages - HikeHub" description="" />
            <div className="flex h-[calc(100dvh-120px)] overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-theme-xs">
                {/* Chat List - Hidden on mobile if chat is selected */}
                <div className={`w-full md:w-1/3 lg:w-1/4 ${selectedChat ? 'hidden md:block' : 'block'}`}>
                    <ChatList
                        chats={chats || []}
                        isLoading={isLoadingChats}
                        onChatSelect={handleChatSelect}
                        currentUser={currentUser}
                        selectedChatId={selectedChat?._id}
                    />
                </div>

                {/* Chat Window - Hidden on mobile if no chat is selected */}
                <div className={`w-full md:w-2/3 lg:w-3/4 ${!selectedChat ? 'hidden md:block' : 'block'}`}>
                    {selectedChat ? (
                        <ChatWindow
                            chat={selectedChat}
                            onBack={handleBackToChatList}
                            currentUser={currentUser}
                            queryClient={queryClient}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50 dark:bg-meta-4/30">
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-black dark:text-white mb-2">Your Messages</h2>
                            <p className="text-gray-500 max-w-sm">
                                Select a conversation from the list or start a new one to chat with event participants.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
