/* eslint-disable react-hooks/exhaustive-deps */
import "../../assets/css/styles.css";
import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import SendIcon from "../../assets/images/icons/send.svg?react";

import SmileIcon from "../../assets/images/icons/smile.svg?react";

import { useOnClickOutside } from "usehooks-ts";
import { ArrowLeft } from "lucide-react";

import io from "socket.io-client";

import { getSender } from "../../shared/helpers/ChatLogics";
import ScrollableChat from "./ScrollableChat";
import { ChatState } from "../../shared/provider/ChatProvider/ChatProvider";
import useSelectedChat from "../hooks/useSelectedChat";
import EditGroupChatModal from "./modal/EditGroupChatModal";
import TypingIndicator from "./TypingIndicator";
import useSendChat from "../hooks/useSendChat";

let socket, selectedChatCompare;

// eslint-disable-next-line react/prop-types
const SingleChat = ({ fetchAgain, setFetchAgain }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const ref = useRef(null);

    const [socketConnected, setSocketConnected] = useState(false);
    const [typing, setTyping] = useState(false);
    const [openEmoji, setEmoji] = useState(false);
    const refEmoji = useRef(null);
    const emojiClickOutside = () => {
        setEmoji(false);
    };

    const onEmojiClick = (e) => {
        setNewMessage((_message) => `${_message} ${e.emoji}`);
    };

    useOnClickOutside(refEmoji, emojiClickOutside);

    const [istyping, setIsTyping] = useState(false);

    const {
        selectedChat,
        setSelectedChat,
        user,
        notification,
        setNotification,
    } = ChatState();

    const { mutate: SearchUser } = useSelectedChat(
        selectedChat?._id,
        setMessages
    );

    const fetchMessages = async () => {
        if (!selectedChat) return;

        SearchUser();

        socket.emit("join chat", selectedChat?._id);
    };

    const { mutate: MessageWithUser } = useSendChat(
        setMessages,
        messages,
        socket
    );

    const sendMessage = async (event, useEnterKey) => {
        if (newMessage) {
            if (useEnterKey && event.key !== "Enter") return;
            event.preventDefault();
            socket.emit("stop typing", selectedChat._id);

            setNewMessage("");
            MessageWithUser({
                content: newMessage,
                chatId: selectedChat,
            });
        }
    };

    const handleEnterKeyPress = (event) => {
        sendMessage(event, true);
    };

    // Handle button click event
    const handleButtonClick = (event) => {
        sendMessage(event, false);
    };

    useEffect(() => {
        socket = io(import.meta.env.VITE_ENDPOINT);
        socket.emit("setup", user);
        socket.on("connected", () => setSocketConnected(true));
        socket.on("typing", () => setIsTyping(true));
        socket.on("stop typing", () => setIsTyping(false));
    }, [socket]);

    useEffect(() => {
        fetchMessages();
        selectedChatCompare = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        const handleMessageReceived = (newMessageReceived) => {
            if (
                !selectedChatCompare ||
                selectedChatCompare._id !== newMessageReceived.chat._id
            ) {
                if (!notification.includes(newMessageReceived)) {
                    setNotification((prevNotification) => [
                        ...prevNotification,
                        newMessageReceived,
                    ]);
                    setFetchAgain(!fetchAgain);
                }
            } else {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    newMessageReceived,
                ]);
            }
        };

        socket.on("message recieved", handleMessageReceived);

        return () => {
            socket.off("message recieved", handleMessageReceived);
        };
    }, [socket]);

    const typingHandler = (e) => {
        e.stopPropagation();

        setNewMessage(e.target.value);

        if (!socketConnected) return;

        if (!typing) {
            // setTyping(true);
            socket.emit("typing", selectedChat._id);
        }
        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength && typing) {
                socket.emit("stop typing", selectedChat._id);
                setTyping(false);
            }
        }, timerLength);
    };

    return (
        <>
            {selectedChat ? (
                <>
                    <text className="text-base md:text-lg pb-3 px-2 w-full font-work-sans flex justify-between items-center">
                        <button onClick={() => setSelectedChat("")}>
                            <ArrowLeft />
                        </button>
                        {messages &&
                            (!selectedChat.isGroupChat ? (
                                <>{getSender(user, selectedChat?.users)}</>
                            ) : (
                                <>
                                    {selectedChat.chatName.toUpperCase()}
                                    <EditGroupChatModal
                                        fetchMessages={fetchMessages}
                                        fetchAgain={fetchAgain}
                                        setFetchAgain={setFetchAgain}
                                    />
                                </>
                            ))}
                    </text>
                    <div className="flex flex-col justify-end p-3 bg-gray-200 w-full h-full rounded-lg overflow-hidden">
                        <div className="messages">
                            <ScrollableChat messages={messages} />
                        </div>

                        <form onKeyDown={handleEnterKeyPress} id="first-name">
                            {istyping ? <TypingIndicator /> : <></>}
                            <div className="flex relative w-full gap-2 mt-2">
                                {openEmoji && (
                                    <div
                                        className="emoji-container"
                                        ref={refEmoji}
                                    >
                                        <EmojiPicker
                                            onEmojiClick={onEmojiClick}
                                            lazyLoad="true"
                                        />
                                    </div>
                                )}

                                <input
                                    className=" form-control border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-blue-500 "
                                    placeholder="Enter a message.."
                                    value={newMessage}
                                    ref={ref}
                                    onChange={(e) => typingHandler(e)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setEmoji(true)}
                                >
                                    <SmileIcon />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleButtonClick}
                                >
                                    <SendIcon />
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            ) : (
                // to get socket.io on same page
                <div className=" flex justify-center items-center h-full">
                    <text className=" pb-3">
                        Click on a user to start chatting
                    </text>
                </div>
            )}
        </>
    );
};

export default SingleChat;
