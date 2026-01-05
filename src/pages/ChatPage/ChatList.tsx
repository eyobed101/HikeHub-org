import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    PlusOutlined,
    SearchOutlined,
    CloseCircleOutlined,
    TeamOutlined
} from "@ant-design/icons";
import {
    type Chat,
    searchUsers,
    type SearchUserResult,
    accessChat
} from "../../services/api/chat";
import useDebounce from "../../hooks/useDebounce";

interface ChatListProps {
    chats: Chat[];
    isLoading: boolean;
    onChatSelect: (chat: Chat) => void;
    currentUser: any;
    selectedChatId?: string;
}

export default function ChatList({ chats, isLoading, onChatSelect, currentUser, selectedChatId }: ChatListProps) {
    const [isSearching, setIsSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const queryClient = useQueryClient();

    const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
        queryKey: ["userSearch", debouncedSearchTerm],
        queryFn: () => searchUsers(debouncedSearchTerm, 10),
        enabled: debouncedSearchTerm.length > 0 && isSearching,
    });

    const accessChatMutation = useMutation({
        mutationFn: (userId: string) => accessChat(userId),
        onSuccess: (newChat) => {
            queryClient.invalidateQueries({ queryKey: ["userChats"] });
            onChatSelect(newChat);
            setIsSearching(false);
            setSearchTerm("");
        },
        onError: (error) => {
            console.error("Failed to create or access chat:", error);
        },
    });

    const handleUserSelect = (user: SearchUserResult) => {
        accessChatMutation.mutate(user._id);
    };

    return (
        <div className="h-full flex flex-col border-r border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                {isSearching ? (
                    <div className="relative flex-1">
                        <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search users..."
                            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 pl-10"
                            autoFocus
                        />
                    </div>
                ) : (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Messages</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">All your conversations</p>
                    </div>
                )}
                <button
                    onClick={() => {
                        setIsSearching(!isSearching);
                        setSearchTerm("");
                    }}
                    className="ml-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.03] text-brand-500 transition-colors"
                >
                    {isSearching ? <CloseCircleOutlined className="text-lg" /> : <PlusOutlined className="text-lg" />}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isSearching ? (
                    // Search Results
                    <div className="p-2 space-y-1">
                        {isLoadingSearch && (
                            <div className="text-center text-gray-500 py-4 text-sm">Searching...</div>
                        )}
                        {searchResults && searchResults.length > 0 && (
                            searchResults.map((user) => (
                                <div
                                    key={user._id}
                                    onClick={() => handleUserSelect(user)}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                                >
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-gray-800 dark:text-white/90 text-sm truncate">
                                            {user.username}
                                        </h3>
                                        <p className="text-xs text-gray-500 truncate">
                                            {user.firstname} {user.lastname}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        {debouncedSearchTerm && !isLoadingSearch && searchResults?.length === 0 && (
                            <div className="text-center text-gray-500 py-8 text-sm">No users found.</div>
                        )}
                    </div>
                ) : (
                    // Chat List
                    <div className="p-2 space-y-1">
                        {isLoading ? (
                            <div className="space-y-3 p-2">
                                {/* Skeleton Loading */}
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex gap-3 animate-pulse">
                                        <div className="w-12 h-12 bg-gray-200 dark:bg-meta-4 rounded-full"></div>
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-4 bg-gray-200 dark:bg-meta-4 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-200 dark:bg-meta-4 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : chats && chats.length > 0 ? (
                            chats.map((chat) => {
                                const otherUser = chat.isGroupChat
                                    ? null
                                    : chat.users.find((user) => user._id !== currentUser?._id);
                                const chatDisplayName = chat.isGroupChat
                                    ? chat.chatName
                                    : otherUser?.username || "Unknown User";
                                const chatDisplayInitial = chat.isGroupChat
                                    ? chat.chatName.charAt(0).toUpperCase()
                                    : otherUser?.username?.charAt(0).toUpperCase() || "U";

                                const isSelected = selectedChatId === chat._id;

                                return (
                                    <div
                                        key={chat._id}
                                        onClick={() => onChatSelect(chat)}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isSelected
                                            ? 'bg-brand-50 dark:bg-brand-500/10'
                                            : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${chat.isGroupChat ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {chat.isGroupChat ? (
                                                <TeamOutlined className="text-lg" />
                                            ) : (
                                                <span className="font-semibold text-lg">{chatDisplayInitial}</span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-brand-500 dark:text-brand-400' : 'text-gray-800 dark:text-white/90'}`}>
                                                    {chatDisplayName}
                                                </h3>
                                                <span className="text-xs text-gray-400 shrink-0 ml-2">
                                                    {chat.latestMessage
                                                        ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })
                                                        : ""}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-0.5">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate pr-2">
                                                    {chat.latestMessage?.content?.text || (chat.latestMessage?.content?.imagePath ? 'Sent an image' : "No messages yet")}
                                                </p>
                                                {chat.unreadCount && chat.unreadCount > 0 ? (
                                                    <span className="bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                                        {chat.unreadCount}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-10">
                                <TeamOutlined className="text-4xl text-gray-300 dark:text-gray-600 mb-2" />
                                <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">No Chats Yet</h3>
                                <p className="text-xs text-gray-500 mt-1">Start a conversation to see it here.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
