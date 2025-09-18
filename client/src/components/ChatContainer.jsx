import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime, formatDateHeader } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import Picker from '@emoji-mart/react'
import { BsEmojiSmile } from 'react-icons/bs';

import { useClickOutside } from '../lib/hooks';

const ChatContainer = () => {

    const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, reactToMessage } = useContext(ChatContext);

    const { authUser, onlineUsers } = useContext(AuthContext);

    const inputRef = useRef()
    const [keyboardWasOpen, setKeyboardWasOpen] = useState(false);
    const messagesEndRef = useRef()
    const [isMobile, setIsMobile] = useState(false);

    const [input, setInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showReactionPaletteFor, setShowReactionPaletteFor] = useState(null);

    const emojiPickerRef = useRef(null);
    useClickOutside(emojiPickerRef, () => setShowEmojiPicker(false));
    useClickOutside(emojiPickerRef, () => setShowReactionPaletteFor(false));

    // Detect mobile devices
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    // Handle sending a message
    const handleSendMessage = async (e) => {
      e.preventDefault();
      if (input.trim() === "") return null;
      const success = await sendMessage({ text: input.trim() });
      if (success) {
        setInput("");
        if (keyboardWasOpen && inputRef.current) {
          requestAnimationFrame(() => {
            inputRef.current.focus();
          });
        }
      }
    };

    const handleReaction = (messageId, emoji) => {
        reactToMessage(messageId, emoji);
        setShowReactionPaletteFor(null);
    };

    // Handle sending an image
    const handleSendImage = async (e) => {
        const file = e.target.files[0];
        if(!file || !file.type.startsWith('image/')) {
            toast.error('Please select an image file.');
            return;
        }
        const reader = new FileReader();

        reader.onloadend = () => {
        (async () => {
            setUploading(true); 
            const success = await sendMessage({ image: reader.result });
            setUploading(false);
            if (!success) {
                toast.error("Image failed to send");
            }
            e.target.value = "";
            setTimeout(() => {
                scrollToBottom();
                if (document.activeElement === inputRef.current) {
                inputRef.current?.focus();
            }
            }, 100);
        })();
        };
        reader.readAsDataURL(file);
    }

    // Track keyboard state
    useEffect(() => {
      const handleFocus = () => setKeyboardWasOpen(true);
      const handleBlur = () => setKeyboardWasOpen(false);

      const input = inputRef.current;
      if (input) {
        input.addEventListener('focus', handleFocus);
        input.addEventListener('blur', handleBlur);
      }

      return () => {
        if (input) {
          input.removeEventListener('focus', handleFocus);
          input.removeEventListener('blur', handleBlur);
        }
      };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    useEffect(() => {
        if(selectedUser) {
            getMessages(selectedUser._id);
        }
    }, [selectedUser])

    useEffect(() => {
        scrollToBottom();
    }, [messages])

    // Handle keyboard appearing/disappearing on mobile
    useEffect(() => {
        if (!isMobile) return;

        const handleResize = () => {
            setTimeout(() => {
                scrollToBottom();
                inputRef.current?.focus();
            }, 300);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile]);

  return selectedUser ? (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {/* Chat Header */}
      <div className="flex items-center gap-2 sm:gap-3 py-2 sm:py-3 mx-2 sm:mx-4 border-b border-stone-500">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-7 sm:w-8 rounded-full"
        />
        <p className="flex-1 text-sm sm:text-lg text-white flex items-center gap-1 sm:gap-2">
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></span>
          )}
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden w-5 sm:max-w-7"
        />
        <img
          src={assets.help_icon}
          alt=""
          className="max-md:hidden w-4 sm:max-w-5"
        />
      </div>

      {/* Messages Body */}
      <div
        className="flex flex-col h-[calc(100%-110px)] sm:h-[calc(100%-120px)] overflow-y-scroll p-2 sm:p-3 pb-4 sm:pb-6">
        {messages.reduce((acc, msg, index) => {
          if (!msg) return acc;

          const currentDate = new Date(msg.createdAt).toDateString();
          const prevDate = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;

          if (currentDate !== prevDate) {
            acc.push(
              <div key={currentDate} className="flex justify-center my-2">
                <span className="bg-gray-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {formatDateHeader(msg.createdAt)}
                </span>
              </div>
            );
          }

          // Group reactions by emoji
          const reactionGroups = msg.reactions?.reduce((groups, reaction) => {
            const emoji = reaction.emoji;
            if (!groups[emoji]) {
              groups[emoji] = [];
            }
            groups[emoji].push(reaction.user);
            return groups;
          }, {});

          acc.push(
            <div key={msg._id} className="flex flex-col items-end group">
                <div className={`flex items-end gap-2 justify-end w-full ${
                    msg.senderId !== authUser._id && "flex-row-reverse"
                }`}>
                    <div className="relative">
                        {msg.image ? (
                            <img src={msg.image} alt="" className="max-w-[180px] sm:max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-1" />
                        ) : (
                            <p className={`p-2 max-w-[150px] sm:max-w-[200px] text-xs sm:text-sm font-light rounded-lg mb-1 break-all bg-violet-500/30 text-white ${
                                msg.senderId === authUser._id ? "rounded-br-none" : "rounded-bl-none"
                            }`}>
                            {msg.text}
                            </p>
                        )}
                        <div className={`absolute top-1/2 -translate-y-1/2 items-center gap-1 flex opacity-20 group-hover:opacity-100 ${
                            msg.senderId === authUser._id ? "-left-8" : "-right-8"
                        }`}>
                            <BsEmojiSmile className="w-4 cursor-pointer text-gray-400" onClick={() => setShowReactionPaletteFor(showReactionPaletteFor === msg._id ? null : msg._id)} />
                        </div>

                        {showReactionPaletteFor === msg._id && (
                            <div ref={emojiPickerRef} className={`absolute bottom-full mb-2 flex gap-1 bg-gray-800 p-1 rounded-full z-10 ${
                                msg.senderId === authUser._id ? 'right-0' : 'left-0'
                            }`}>
                                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                    <span key={emoji} className="cursor-pointer text-lg" onClick={() => handleReaction(msg._id, emoji)}>{emoji}</span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="text-center text-[10px] sm:text-xs">
                        <img src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt="" className="w-5 sm:w-7 rounded-full" />
                        <p className="text-gray-500">{formatMessageTime(msg.createdAt)}</p>
                    </div>
                </div>
                {reactionGroups && Object.keys(reactionGroups).length > 0 && (
                    <div className="flex gap-1 mt-1 pr-8">
                        {Object.entries(reactionGroups).map(([emoji, users]) => (
                            <div key={emoji} className="flex items-center bg-gray-700/50 rounded-full px-2 py-0.5 text-xs">
                                <span>{emoji}</span>
                                <span className="ml-1 text-white">{users.length}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          );
          return acc;
        }, [])}
        {/* Loader (Image uploading spinner) */}
        {uploading && (
          <div className="flex justify-center items-center py-2">
            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
            <span className="text-xs text-white ml-2">Uploading image...</span>
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Message Input */}
      <div className={`relative flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-[#8185B2]/10`}>
        {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-full mb-2 z-10 right-0 sm:left-0 sm:right-auto">
                <Picker onEmojiSelect={(e) => setInput(input + e.native)} theme="dark" />
            </div>
        )}
        <div className="flex-1 flex items-center bg-gray-100/12 px-2 sm:px-3 rounded-full">
          <BsEmojiSmile className="w-5 h-5 cursor-pointer text-gray-400" onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
          <input
            ref={inputRef}
            disabled={uploading}
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) => (e.key === "Enter" ? handleSendMessage(e) : null)}
            type="text"
            placeholder="Send a message..."
            className="flex-1 text-xs sm:text-sm p-2 sm:p-3 border-none bg-transparent rounded-lg outline-none text-white placeholder-gray-400"
          />
          <input disabled={uploading} onChange={handleSendImage} type="file" id="image" accept="image/png, image/jpeg, image/jpg" hidden />
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="" className={`w-4 sm:w-5 mr-1 sm:mr-2 cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : ""}`} />
          </label>
        </div>
        <img onClick={!uploading ? handleSendMessage : null} src={assets.send_button} alt="" className={`w-5 sm:w-7 cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : ""}`} />
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} alt="" className="w-12 sm:max-w-16" />
      <p className="text-sm sm:text-lg font-medium text-white">
        Chat anytime, anywhere
      </p>
    </div>
  );
}

export default ChatContainer
