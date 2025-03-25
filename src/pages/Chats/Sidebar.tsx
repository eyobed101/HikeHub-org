import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext"; // Import the theme context

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  unreadMessages: number;
}

interface SidebarProps {
  conversations: Conversation[];
}

const Sidebar: React.FC<SidebarProps> = ({ conversations }) => {
  const { theme } = useTheme(); // Consume the theme from context
  const [isExpanded, setIsExpanded] = useState(false); // State to control sidebar visibility

  return (
    <div className="relative w-[40%] rounded-bl-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 flex flex-col h-full">
      {/* Toggle Button (Visible on Mobile) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`absolute top-4 left-4 z-20 p-2 rounded-full shadow-lg md:hidden ${
          theme === "dark" ? "bg-indigo-600 text-white" : "bg-indigo-500 text-white"
        }`}
      >
        {isExpanded ? "Close" : "Menu"}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static z-10 transform ${
          isExpanded ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 w-64 md:w-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full`}
      >
        <div className="flex flex-col p-5 h-full">
          <h2 className="text-gray-800 dark:text-white/90 text-lg font-bold mb-4">Conversations</h2>
          <div className="space-y-2 overflow-y-auto flex-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center p-2 rounded shadow ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    theme === "dark" ? "bg-indigo-400 text-white" : "bg-indigo-500 text-white"
                  }`}
                >
                  {conversation.avatar}
                </div>
                <div className="ml-4">
                  <p className="font-semibold">{conversation.name}</p>
                  {conversation.unreadMessages > 0 && (
                    <span
                      className={`text-sm ${
                        theme === "dark" ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {conversation.unreadMessages} unread
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay (Visible on Mobile when Sidebar is Expanded) */}
      {isExpanded && (
        <div
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-5 md:hidden"
        ></div>
      )}
    </div>
  );
};

export default Sidebar;