import React, { useCallback, useEffect, useState } from "react";
import Conversation from "./Conversation";
import Messages from "./Messages";
import io from 'socket.io-client';
import axiosInstance from "../../utils/axiosInstance";
import { useSelector } from "react-redux";

const socket = io('https://hikeapi.issipeteta.net/api/v1.0/');

const Chat: React.FC = () => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loggedInUserId, setLoggedInUserId] = useState(null);
  const [chatId, setChatId] = useState<string | null>(null); // Dynamically set chatId
  const current = useSelector((state) => state.user);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('auth/users');
      const { Superadmins, EventOrganizers, Hikers } = response.data;

      const allUsers = [
        ...Superadmins.map(user => ({ ...user, role: 'Superadmin' })),
        ...EventOrganizers.map(user => ({ ...user, role: 'Event Organizer' })),
        ...Hikers.map(user => ({ ...user, role: 'Hiker' }))
      ];

      setUsers(allUsers);

      const loggedInUser = allUsers.find((user) => user.username === current.username);
      if (loggedInUser) {
        setLoggedInUserId(loggedInUser.id);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();

    if (!chatId) return; // Ensure chatId is set before proceeding

    const fetchChatHistory = async () => {
      try {
        const response = await axiosInstance.get(`auth/messages/${chatId}`);
        const formattedMessages = response.data.messages.map((message) => ({
          _id: message._id,
          text: message.message,
          createdAt: new Date(message.createdAt),
          user: {
            _id: message.sender.username,
            name: message.sender.username,
          },
        }));
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchChatHistory();

    socket.emit('join-chat', chatId);

    socket.on('receive-message', (message) => {
      const receivedMessage = {
        _id: message._id || '',
        text: message.message || '',
        createdAt: new Date(message.createdAt) || new Date(),
        user: {
          _id: message.sender?.username || 'unknown',
          name: message.sender?.username || 'Unknown User',
        },
      };

      setMessages((previousMessages) => [...previousMessages, receivedMessage]);
    });

    return () => {
      socket.off('receive-message');
      socket.emit('leave-chat', chatId); // Leave the chat room on cleanup
    };
  }, [chatId]);

  const onSend = useCallback(
    (messages = []) => {
      if (!loggedInUserId || !chatId) return;

      const message = messages[0];

      socket.emit('send-message', {
        chatId,
        senderId: loggedInUserId,
        message: message.text,
        messageType: 'text',
        image: '',
        video: '',
        audio: ''
      });

      setMessages((previousMessages) => [...previousMessages, message]);
    },
    [chatId, loggedInUserId]
  );

  return (
    <div className="">
      <div className="flex bg-white dark:bg-gray-900">
        {/* Sidebar */}
        {/* <div className="w-20 text-gray-500 h-screen flex flex-col items-center justify-between py-5">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="py-4 hover:text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <div className="py-4 hover:text-gray-700 flex flex-col items-center justify-center text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <div className="w-2 h-2 bg-blue-800 rounded-full"></div>
            </div>
            <div className="py-4 hover:text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
          </div>
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div> */}

        {/* Chat Sidebar */}
        <div className="w-80 h-screen dark:bg-gray-800 bg-gray-100 p-2 hidden md:block">
          <div className="h-full overflow-y-auto">
            <div className="text-xl font-extrabold text-gray-600 dark:text-gray-200 p-3">
              Messages
            </div>
            <div className="search-chat flex p-3">
              <input
                className="input text-gray-700 dark:text-gray-200 text-sm p-3 focus:outline-none bg-gray-200 dark:bg-gray-700 w-full rounded-l-md"
                type="text"
                placeholder="Search Messages"
              />
              <div className="bg-gray-200 dark:bg-gray-700 flex justify-center items-center pr-3 text-gray-400 rounded-r-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-600 dark:text-gray-200 p-3">
              Recent
            </div>
            <Conversation />
          </div>
        </div>

        {/* Messages Section */}
        <div className="flex-grow h-screen p-2 rounded-md">
          <Messages
            messages={messages}
            onSend={onSend}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;