import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BsEmojiSmile, BsFillEmojiSmileFill } from "react-icons/bs";
import { fetchMessages, sendMessage } from '../apis/messages';
import { fetchChats, setNotifications } from '../redux/chatsSlice';
import Loading from '../components/ui/Loading';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { getChatName } from '../utils/logics';
import Typing from '../components/ui/Typing';
import { validUser } from '../apis/auth';
import { AiOutlineCamera, AiOutlineCloseCircle } from 'react-icons/ai';
import io from "socket.io-client";
import './home.css';
import MessageHistory from '../components/MessageHistory';
import Model from '../components/Model';
import axios from 'axios';
import { toast } from 'react-toastify';

const ENDPOINT = process.env.REACT_APP_SERVER_URL;
let socket, selectedChatCompare;

function Chat(props) {
  const { activeChat, notifications } = useSelector((state) => state.chats);
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const activeUser = useSelector((state) => state.activeUser);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const fileType = selectedFile.type.split("/")[0];

    if (fileType === "image") {
      setFilePreview(URL.createObjectURL(selectedFile));
    } else if (fileType === "video") {
      setFilePreview(URL.createObjectURL(selectedFile));
    } else {
      setFilePreview(selectedFile.name); // For other files, just display the name
    }
  };

  const handleFileRemove = () => {
    setFile(null);
    setFilePreview(null);
    document.getElementById('file-upload').value = '';
  };

  const handleFileUpload = async () => {
    if (!file) {
      console.error('No file selected');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/api/upload`, 
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const fileUrl = uploadResponse.data.fileUrl;
      const fileType = file.type.split("/")[0];

      const messageData = await sendMessage({
        chatId: activeChat._id,
        message: '',
        file: fileUrl,
        fileType: fileType,
      });

      socket.emit('new message', messageData);
      setMessages([...messages, messageData]);

      handleFileRemove();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
    }
  };

  const keyDownFunction = async (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && (message || file)) {
      if (file) {
        await handleFileUpload();
      } else {
        const data = await sendMessage({ chatId: activeChat._id, message });
        socket.emit('new message', data);
        setMessages([...messages, data]);
      }
      setMessage('');
      socket.emit('stop typing', activeChat._id);
      dispatch(fetchChats());
    }
  };


  useEffect(() => {
    socket = io(ENDPOINT);
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, []);

  useEffect(() => {
    socket.emit("setup", activeUser);
    socket.on("connected", () => {
      setSocketConnected(true);
    });
  }, [messages, activeUser]);

  useEffect(() => {
    const fetchMessagesFunc = async () => {
      if (activeChat) {
        setLoading(true);
        const data = await fetchMessages(activeChat._id);
        setMessages(data);
        socket.emit("join room", activeChat._id);
        setLoading(false);
      }
    };
    fetchMessagesFunc();
    selectedChatCompare = activeChat;
  }, [activeChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if ((!selectedChatCompare || selectedChatCompare._id) !== newMessageRecieved.chatId._id) {
        if (!notifications.includes(newMessageRecieved)) {
          dispatch(setNotifications([newMessageRecieved, ...notifications]));
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
      dispatch(fetchChats());
    });
  });

  useEffect(() => {
    const isValid = async () => {
      const data = await validUser();
      if (!data?.user) {
        window.location.href = "/login";
      }
    };
    isValid();
  }, []);

  if (loading) {
    return <div className={props.className}><Loading /></div>;
  }

  return (
    <>
      {activeChat ? (
        <div className={props.className}>
          <div className="flex justify-between items-center px-5 bg-[#ffff] w-[100%]">
            <div className="flex items-center gap-x-[10px]">
              <div className="flex flex-col items-start justify-center">
                <h5 className="text-[17px] text-[#2b2e33] font-bold tracking-wide">
                  {getChatName(activeChat, activeUser)}
                </h5>
              </div>
            </div>
            <div><Model /></div>
          </div>
          <div className="scrollbar-hide w-[100%] h-[70vh] md:h-[66vh] lg:h-[69vh] flex flex-col overflow-y-scroll p-4">
            <MessageHistory typing={isTyping} messages={messages} />
            {/* Image Preview Container - Aligned to the Right */}
            {/* File Preview */}
            <div className="flex justify-end">
              {filePreview && (
                <div className="relative mt-2">
                  {file.type.startsWith("image") ? (
                    <img src={filePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                  ) : file.type.startsWith("video") ? (
                    <video controls className="w-24 h-24 rounded-lg">
                      <source src={filePreview} type={file.type} />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <a href={filePreview} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                      {file.name}
                    </a>
                  )}
                  <AiOutlineCloseCircle className="absolute top-[-10px] right-[-10px] text-red-500 cursor-pointer bg-white rounded-full p-1" onClick={handleFileRemove} />
                </div>
              )}
            </div>


            <div className="ml-7 -mb-10">
              {isTyping ? <Typing width="100" height="100" /> : ""}
            </div>
          </div>
          <div className="absolute left-[31%] bottom-[8%]">
            {showPicker && <Picker data={data} onEmojiSelect={(e) => setMessage(message + e.native)} />}
            <div className="border-[1px] border-[#aabac8] px-6 py-3 w-[360px] sm:w-[400px] md:w-[350px] lg:w-[400px] rounded-t-[10px]">
              <form onKeyDown={(e) => keyDownFunction(e)} onSubmit={(e) => e.preventDefault()}>
                <input
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (!socketConnected) return;
                    if (!typing) {
                      setTyping(true);
                      socket.emit("typing", activeChat._id);
                    }
                    let lastTime = new Date().getTime();
                    var time = 3000;
                    setTimeout(() => {
                      var timeNow = new Date().getTime();
                      var timeDiff = timeNow - lastTime;
                      if (timeDiff >= time && typing) {
                        socket.emit("stop typing", activeChat._id);
                        setTyping(false);
                      }
                    }, time);
                  }}
                  className="focus:outline-0 w-[100%] bg-[#f8f9fa]"
                  type="text"
                  name="message"
                  placeholder="Enter message"
                  value={message}
                />
              </form>
            </div>
            <div className="border-x-[1px] border-b-[1px] bg-[#f8f9fa] border-[#aabac8] px-6 py-3 w-[360px] sm:w-[400px] md:w-[350px] lg:w-[400px] rounded-b-[10px] h-[50px]">
              <div className="flex justify-between items-start">
                <div className="cursor-pointer" onClick={() => setShowPicker(!showPicker)}>
                  {showPicker ? (
                    <BsFillEmojiSmileFill className="w-[20px] h-[20px] text-[#ffb02e] border-[black]" />
                  ) : (
                    <BsEmojiSmile className="w-[20px] h-[20px]" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*, video/*, .pdf, .docx, .xlsx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <AiOutlineCamera className="cursor-pointer text-[#aabac8] text-[20px]" />
                </label>
                <button onClick={(e) => keyDownFunction(e)} className="bg-[#f8f9fa] border-[2px] border-[#d4d4d4] text-[14px] px-2 py-[3px] text-[#9e9e9e] font-medium rounded-[7px] -mt-1">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={props.className}>
          <div className="relative">
            <div className="absolute top-[40vh] left-[44%] flex flex-col items-center justify-center gap-y-3">
              <img className="w-[50px] h-[50px] rounded-[25px]" alt="User profile" src={activeUser.profilePic} />
              <h3 className="text-[#111b21] text-[20px] font-medium tracking-wider">
                Welcome <span className="text-[#166e48] text-[19px] font-bold">{activeUser.name}</span>
              </h3>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Chat;