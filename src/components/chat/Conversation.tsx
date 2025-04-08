import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { useSelector } from "react-redux";

interface ConversationProps {
  onSelectChat: (chatId: string) => void; // Callback to select a chat
}

const Conversation: React.FC<ConversationProps> = ({ onSelectChat }) => {
  const [chatList, setChatList] = useState<any[]>([]); // Adjust the type as needed
  interface RootState {
    auth: {
      isAuthenticated: boolean;
      user:String
    };
  }

  const current = useSelector((state: RootState) => state.auth.user);
  const fetchChatList = async () => {
    try {
      if (!current) {
        console.error("User is not logged in or missing ID");
        return;
      }

      const response = await axiosInstance.get(`auth/chats/${current}`); // Replace with the correct endpoint
      setChatList(response.data.chats);
    } catch (error) {
      console.error("Error fetching chat list:", error);
    }
  };

  useEffect(() => {
    fetchChatList();
  }, [current]);

  return (
    <div>
      {chatList.length > 0 ? (
        chatList.map((chat) => (
          <div
            key={chat.id}
            className="p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => onSelectChat(chat.id)} // Pass the selected chatId
          >
            <div className="text-gray-800 dark:text-gray-200 font-semibold">
              {chat.participantName} {/* Replace with the participant's name */}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {chat.lastMessage} {/* Replace with the last message */}
            </div>
          </div>
        ))
      ) : (
        <div className="text-gray-500 dark:text-gray-400 p-3">No conversations yet.</div>
      )}
    </div>
  );
};

export default Conversation;