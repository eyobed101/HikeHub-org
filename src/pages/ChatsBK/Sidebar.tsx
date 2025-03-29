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

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative">
      {/* Toggle Icon (Visible on Mobile) */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 items-center justify-center w-10 h-10 text-gray-500 border border-gray-200 rounded-lg dark:border-gray-800 dark:text-gray-400"
        onClick={handleToggle}
        aria-label="Toggle Sidebar"
      >
        {isExpanded ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg
            width="16"
            height="12"
            viewBox="0 0 16 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.41422 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-40 transform border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 flex flex-col${
          isExpanded ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0 transition-transform duration-300 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full`}
      >
        <div className="flex flex-col h-full w-full">
          <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-white/90">Conversations</h2>
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
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
        ></div>
      )}
    </div>
  );
};

export default Sidebar;