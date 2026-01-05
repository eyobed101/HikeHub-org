import React, { useState, useEffect, useRef } from "react";
import { useMutation, useInfiniteQuery } from "@tanstack/react-query";
import {
    SendOutlined,
    PaperClipOutlined,
    DeleteOutlined,
    LoadingOutlined,
    ArrowLeftOutlined,
    CheckOutlined
} from "@ant-design/icons";
import {
    getChatMessages,
    sendMessage,
    markChatAsRead,
    type Chat,
    type Message,
    type PaginatedMessages,
} from "../../services/api/chat";
import { chatSocketService } from "../../services/socket/chatSocket";
import { Upload, Avatar } from "antd";

interface ChatWindowProps {
    chat: Chat;
    onBack: () => void;
    currentUser: any;
    queryClient: any;
}

export default function ChatWindow({ chat, onBack, currentUser, queryClient }: ChatWindowProps) {
    const [newMessageContent, setNewMessageContent] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const isInitialLoad = useRef(true);

    // Mark as read on mount/chat change
    const markAsReadMutation = useMutation({
        mutationFn: () => markChatAsRead(chat._id),
        onSuccess: () => {
            queryClient.setQueryData(['userChats'], (oldData: Chat[] | undefined) => {
                if (!oldData) return [];
                return oldData.map(c =>
                    c._id === chat._id ? { ...c, unreadCount: 0 } : c
                );
            });
        },
    });

    useEffect(() => {
        markAsReadMutation.mutate();
        setNewMessageContent(""); // Clear input on chat change
        setSelectedImage(null);
    }, [chat._id]);

    const {
        data: paginatedMessages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery<PaginatedMessages>({
        queryKey: ["chatMessages", chat._id],
        queryFn: ({ pageParam = 1 }) => getChatMessages(chat._id, pageParam as number),
        getNextPageParam: (lastPage) => {
            if (lastPage && lastPage.pagination && lastPage.pagination.currentPage < lastPage.pagination.totalPages) {
                return lastPage.pagination.currentPage + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!chat._id,
    });

    const messages = paginatedMessages?.pages.flatMap(page => page.messages) || [];

    // Socket setup
    useEffect(() => {
        if (chat._id) {
            chatSocketService.joinChat(chat._id);

            const handleMessageReceived = (newMessage: Message) => {
                // Mark as read if receiving message
                if (newMessage.sender._id !== currentUser?._id) {
                    chatSocketService.markMessageAsRead(newMessage._id, newMessage.chat);
                }

                queryClient.setQueryData(["chatMessages", chat._id], (oldData: any) => {
                    if (!oldData || !oldData.pages) {
                        return {
                            pages: [{ messages: [newMessage], pagination: { currentPage: 1, totalPages: 1, totalMessages: 1 } }],
                            pageParams: [1]
                        };
                    }

                    const newPages = [...oldData.pages];
                    // Add new message to start
                    newPages[0] = {
                        ...newPages[0],
                        messages: [newMessage, ...newPages[0].messages],
                    };

                    return { ...oldData, pages: newPages };
                });
                queryClient.invalidateQueries({ queryKey: ["userChats"] });
            };

            const handleTyping = (chatId: string) => {
                if (chatId === chat._id) {
                    setIsTyping(true);
                    // Optionally set typing user name if available in event
                }
            };

            const handleStopTyping = (chatId: string) => {
                if (chatId === chat._id) setIsTyping(false);
            };

            chatSocketService.onMessageReceived(handleMessageReceived);
            chatSocketService.onTyping(handleTyping);
            chatSocketService.onStopTyping(handleStopTyping);
        }

        return () => {
            // Cleanup listeners if specific remove method existed for specific events, 
            // but removeAllListeners is too aggressive if shared. 
            // Assuming singleton service handles listeners correctly or overwrites them.
            // Ideally we should remove specific listeners.
        };
    }, [chat._id, currentUser?._id, queryClient]);


    // Auto-scroll
    useEffect(() => {
        if (isInitialLoad.current || !isFetchingNextPage) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        if (isInitialLoad.current && messages.length > 0) {
            isInitialLoad.current = false;
        }
    }, [messages, isFetchingNextPage]);


    const handleSendMessage = async () => {
        if (!newMessageContent.trim() && !selectedImage) return;

        chatSocketService.emitStopTyping(chat._id);
        setIsSending(true);

        const tempId = `temp-${Date.now()}`;
        // Optimistic Update
        const optimisticMessage: Message = {
            _id: tempId,
            sender: currentUser,
            content: {
                text: newMessageContent.trim() || undefined,
                imagePath: selectedImage ? URL.createObjectURL(selectedImage) : undefined,
            },
            chat: chat._id,
            readBy: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isOptimistic: true,
        };

        // Update Cache
        queryClient.setQueryData(["chatMessages", chat._id], (oldData: any) => {
            const newPages = oldData ? [...oldData.pages] : [{ messages: [], pagination: {} }];
            newPages[0].messages = [optimisticMessage, ...newPages[0].messages];
            return { ...oldData, pages: newPages };
        });

        setNewMessageContent("");
        setSelectedImage(null);

        try {
            const response = await sendMessage(chat._id, optimisticMessage.content.text || "", selectedImage || undefined);

            // Replace optimistic
            queryClient.setQueryData(["chatMessages", chat._id], (oldData: any) => {
                const newPages = oldData.pages.map((p: any) => ({
                    ...p,
                    messages: p.messages.map((m: Message) => m._id === tempId ? response : m)
                }));
                return { ...oldData, pages: newPages };
            });

            queryClient.invalidateQueries({ queryKey: ["userChats"] });
        } catch (error) {
            console.error("Send failed", error);
            // Remove optimistic
            queryClient.setQueryData(["chatMessages", chat._id], (oldData: any) => {
                const newPages = oldData.pages.map((p: any) => ({
                    ...p,
                    messages: p.messages.filter((m: Message) => m._id !== tempId)
                }));
                return { ...oldData, pages: newPages };
            });
            // Show error toast
        } finally {
            setIsSending(false);
        }
    };

    const onTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessageContent(e.target.value);
        chatSocketService.emitTyping(chat._id);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            chatSocketService.emitStopTyping(chat._id);
        }, 1000);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop } = e.currentTarget;
        if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    const otherUser = chat.isGroupChat
        ? null
        : chat.users.find((user) => user._id !== currentUser?._id);
    const chatName = chat.isGroupChat ? chat.chatName : otherUser?.username || "Unknown";

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                        onClick={onBack}
                    >
                        <ArrowLeftOutlined className="text-lg" />
                    </button>
                    <Avatar
                        size="large"
                        className={chat.isGroupChat ? "bg-orange-500" : "bg-blue-500"}
                    >
                        {chat.isGroupChat ? "G" : chatName.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white/90">{chatName}</h3>
                        {isTyping && <span className="text-xs text-primary animate-pulse">Typing...</span>}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto px-4 py-4 flex flex-col-reverse gap-3 custom-scrollbar"
                onScroll={handleScroll}
                ref={chatContainerRef}
            >
                {isFetchingNextPage && <div className="text-center py-2"><LoadingOutlined /></div>}

                {messages.map((msg, index) => {
                    const isMyMessage = msg.sender._id === currentUser?._id;
                    return (
                        <div
                            key={msg._id || index}
                            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] rounded-lg px-4 py-2 shadow-sm ${isMyMessage
                                    ? 'bg-brand-500 text-white rounded-br-none'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white/90 rounded-bl-none'
                                    }`}
                            >
                                {msg.content.imagePath && (
                                    <img
                                        src={msg.isOptimistic ? msg.localImageUrl : msg.content.imagePath}
                                        alt="Shared"
                                        className="rounded-lg max-h-48 mb-2 object-cover cursor-pointer"
                                    />
                                )}
                                {msg.content.text && <p className="text-sm whitespace-pre-wrap">{msg.content.text}</p>}

                                <div className="flex items-center justify-end gap-1 mt-1">
                                    <span className={`text-[10px] ${isMyMessage ? 'text-white/80' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMyMessage && (
                                        <CheckOutlined className={`text-[10px] ${true ? 'text-white' : 'text-white/50'}`} />
                                        // Check logic for read receipt?
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-transparent border-t border-gray-200 dark:border-gray-800">
                {selectedImage && (
                    <div className="mb-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <PaperClipOutlined />
                        <span className="text-xs truncate max-w-[200px]">{selectedImage.name}</span>
                        <button
                            className="p-1 ml-auto text-red-500 hover:text-red-700"
                            onClick={() => setSelectedImage(null)}
                        >
                            <DeleteOutlined />
                        </button>
                    </div>
                )}
                <div className="flex gap-2">
                    <div className="flex gap-2 items-center w-full">
                        <Upload
                            beforeUpload={(file) => {
                                setSelectedImage(file);
                                return false;
                            }}
                            showUploadList={false}
                            accept="image/*"
                        >
                            <button className="p-2 transition-colors text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-white">
                                <PaperClipOutlined className="text-xl" />
                            </button>
                        </Upload>

                        <input
                            value={newMessageContent}
                            onChange={onTyping}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendMessage();
                            }}
                            placeholder="Type a message..."
                            className="flex-1 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 outline-none transition-all"
                        />

                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessageContent.trim() && !selectedImage}
                            className={`p-3 rounded-lg flex items-center justify-center transition-all ${!newMessageContent.trim() && !selectedImage
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500"
                                : "bg-brand-500 text-white hover:bg-brand-600 shadow-md"
                                }`}
                        >
                            {isSending ? <LoadingOutlined /> : <SendOutlined />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
