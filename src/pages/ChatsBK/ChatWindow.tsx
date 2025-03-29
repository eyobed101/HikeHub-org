import React, { useState } from "react";
import MessageBubble from "./MessageBubble";
import { useTheme } from "../../context/ThemeContext";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  fileUrl?: string; // Optional property for file attachments
}

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string, file?: File) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State to store the selected file
  const { theme } = useTheme(); // Consume the theme from context

  const handleSend = () => {
    if (newMessage.trim() || selectedFile) {
      onSendMessage(newMessage, selectedFile);
      setNewMessage("");
      setSelectedFile(null); // Clear the selected file after sending
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="rounded-br-2xl w-full border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 flex flex-col h-full">
      {/* Messages Section */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>

      {/* Input Section (Stuck at the Bottom) */}
      <div className="flex items-center mt-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className={`text-gray-800 dark:text-white/90 border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-white/[0.03] w-full`}
          placeholder="Type a message..."
        />
        <label
          htmlFor="file-upload"
          className={`ml-2 px-4 py-2 rounded cursor-pointer ${
            theme === "dark" ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Upload
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        <button
          onClick={handleSend}
          className={`ml-2 px-4 py-2 rounded ${
            theme === "dark" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-500 hover:bg-indigo-600"
          } text-white`}
        >
          Send
        </button>
      </div>

      {/* Display Selected File */}
      {selectedFile && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Selected File: {selectedFile.name}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;