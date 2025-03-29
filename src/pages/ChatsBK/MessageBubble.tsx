import React from "react";
import { useTheme } from "../../context/ThemeContext";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { theme } = useTheme(); // Consume the theme from context
  const isSender = message.sender === "A"; // Adjust based on your logic

  return (
    <div className={`flex ${isSender ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`p-2 rounded-lg ${
          isSender
            ? theme === "dark"
              ? "bg-indigo-500 text-white"
              : "bg-indigo-100 text-black"
            : theme === "dark"
            ? "bg-gray-700 text-white"
            : "bg-gray-200 text-black"
        }`}
      >
        <p>{message.text}</p>
        <span className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default MessageBubble;