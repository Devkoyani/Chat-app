import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios } = useContext(AuthContext);

    // function to get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get('/api/messages/users');
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // function to get all messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // function to send message to selected user
    const sendMessage = async (messageData) => {
      try {
        const { data } = await axios.post(
          `/api/messages/send/${selectedUser._id}`,
          messageData
        );
        if (data.success) {
          setMessages((prevMessages) => [...prevMessages, data.message]);
          return true;

        } else {
          toast.error(data.message);
          return false;
        }
      } catch (error) {
        toast.error(error.message);
        return false;
      }
    };

    // function to subscribe to messages for selected user
    const subscribeToMessages = async () => {
      if (!socket) return;

      socket.on("newMessage", (newMessage) => {
        // Check if this message is already in state
        setMessages((prevMessages) => {
          if (prevMessages.some((msg) => msg._id === newMessage._id)) {
            return prevMessages;
          }

          if (selectedUser && newMessage.senderId === selectedUser._id) {
            newMessage.seen = true;
            axios.put(`/api/messages/mark/${newMessage._id}`);
            return [...prevMessages, newMessage];
          } else {
            setUnseenMessages((prevUnseenMessages) => ({
              ...prevUnseenMessages,
              [newMessage.senderId]:
                (prevUnseenMessages[newMessage.senderId] || 0) + 1,
            }));
            return prevMessages;
          }
        });
      });
    };

    // function to unsubscribe from messages for selected user
    const unsubscribeFromMessages = async () => {
        if(socket)
        socket.off('newMessage');
    }

    useEffect(() => {
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser]);

    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,       
        unseenMessages,
        setUnseenMessages,
    }

    return (
    <ChatContext.Provider value={value}>
        {children}
    </ChatContext.Provider>
    )
};