import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import Header from "./Header";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  unreadMessages: number;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "A", text: "Hello!", timestamp: new Date().toISOString() },
    { id: "2", sender: "B", text: "Hi there!", timestamp: new Date().toISOString() },
  ]);

  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "1", name: "John Doe", avatar: "J", unreadMessages: 0 },
    { id: "2", name: "Jane Smith", avatar: "J", unreadMessages: 2 },
  ]);

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: String(messages.length + 1),
      sender: "A",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header dynamically adapts to the theme */}
      <Header title="Chats" />
      <div className="flex h-full">
        {/* Sidebar dynamically adapts to the theme */}
        <Sidebar conversations={conversations} />
        {/* ChatWindow dynamically adapts to the theme */}
        <ChatWindow messages={messages} onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatPage;