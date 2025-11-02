import React, { useEffect, useRef, useState } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { IoMdAdd } from "react-icons/io";

export default function WhatsAppChatBox({ socket, username, room, contact, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const scrollRef = useRef();
  const typingTimeoutRef = useRef();
  console.log(messages);
  
  
  const makeId = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg) => {
      setMessages((prev) => {
        if (msg?.id && prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleHistory = (hist) => setMessages(hist || []);

    const handleTyping = ({ user, isTyping }) => {
      setTypingUsers((prev) =>
        isTyping
          ? Array.from(new Set([...prev, user]))
          : prev.filter((u) => u !== user)
      );
    };

    const handleEdit = (updatedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
      );
    };

    const handleDelete = (id) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    };

    socket.on("message", handleMessage);
    socket.on("history", handleHistory);
    socket.on("typing", handleTyping);
    socket.on("edit-message", handleEdit);
    socket.on("delete-message", handleDelete);

    return () => {
      socket.off("message", handleMessage);
      socket.off("history", handleHistory);
      socket.off("typing", handleTyping);
      socket.off("edit-message", handleEdit);
      socket.off("delete-message", handleDelete);
    };
  }, [socket]);

  
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit("typing", { user: username, room, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { user: username, room, isTyping: false });
    }, 1000);
  };

  
  const sendMessage = () => {
    if (!input.trim()) return;

    if (editingId) {
      const editedMsg = {
        id: editingId,
        text: input.trim(),
        from: username,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === editingId ? editedMsg : m))
      );
      socket.emit("edit-message", { ...editedMsg, room });
      setEditingId(null);
      setInput("");
      return;
    }

    const id = makeId();
    const msg = {
      id,
      from: username,
      text: input.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, msg]);
    socket.emit("message", { ...msg, room });
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  
  const startEdit = (m) => {
    setEditingId(m.id);
    setInput(m.text);
  };

  const deleteMessage = (id) => {
    if (!window.confirm("Delete this message?")) return;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    socket.emit("delete-message", { id, room });
  };

  const isTyping = typingUsers.length > 0;

  return (
    <div className="max-w-4xl  h-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-4  font-sans overflow-hidden">
      
      <aside className="hidden md:flex md:flex-col gap-4">
        <div className="bg-white rounded-2xl shadow p-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center font-semibold">
            {username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-medium">{username}</div>
            <div className="text-xs text-gray-500">{contact?.status || "Online"}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden flex-1">
          <div className="p-3 text-sm text-gray-500 border-b">Chats</div>
          <div className="p-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            
                  <div className="flex-1">
              <div className="flex justify-between">
                <div className="font-medium">{username}</div>
                <div className="text-xs text-gray-400">8:17 PM</div>
              </div>
              <div className="text-xs text-gray-500 truncate">Sent you a photo</div>
            </div>
            
          </div>
        </div>
      </aside>

      
      <main className="col-span-1 md:col-span-2 flex flex-col text-black rounded-2xl shadow overflow-hidden">        
        <div className="flex items-center gap-3 p-4 border-b  text-white">
          <div className="w-10 h-10 rounded-full bg-green-300 flex items-center justify-center font-semibold text-gray-800">
            {contact?.name?.[0].toUpperCase() || username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-black">{contact?.name || username}</div>
            <div className="text-xs opacity-80 text-black">
              {isTyping ? "typing..." : contact?.status || "Online"}
            </div>
          </div>
          <button onClick={onLeave} className="p-2 rounded-3xl hover:bg-[#a1a1a1] text-black text-2xl">⋮</button>
        </div>
      <hr/>
        
        <div className="flex-1 overflow-auto p-4 space-y-4 ">
          {messages.map((m) => {
            const isMe = m.from === username;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`relative group max-w-[70%] p-3 rounded-2xl break-words ${
                    isMe
                      ? "bg-[#DCF8C6] text-gray-800 rounded-br-none"
                      : "bg-[#a1a1a1] text-gray-800 rounded-bl-none"
                  }`}
                >
                  {!isMe?m.from:''}
                  <div className="whitespace-pre-line">{m.text}</div>
                  <div className="text-[10px] text-gray-500 text-right mt-1">{m.time}</div>

                  {isMe && (
                    <div className="absolute hidden group-hover:flex gap-1 top-1 right-1">
                      <button
                        onClick={() => startEdit(m)}
                        className="text-xs px-1 rounded bg-gray-100 hover:bg-gray-200"
                        title="Edit"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => deleteMessage(m.id)}
                        className="text-xs px-1 rounded bg-gray-100 hover:bg-gray-200"
                        title="Delete"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-300" />
              <div className="bg-white p-2 rounded-xl flex gap-1">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-150" />
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          )}
          <div ref={scrollRef}></div>
        </div>

        
        <div className="p-3 border-t">
          <div className="flex items-end gap-3">
            
            <div className="flex-1">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={editingId ? "Editing message..." : "Type a message"}
                rows={1}
                className={`w-full resize-none rounded-full border px-4 py-2 focus:outline-none ${
                  editingId
                    ? "border-yellow-400 focus:ring-yellow-400"
                    : "focus:ring-green-400"
                } focus:ring-1 bg-white`}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInput((v) => v + " 🙂")}
                className="p-2 rounded-full hover:bg-gray-200"
              >
                😊
              </button>
              <button
                onClick={sendMessage}
                className={`${
                  editingId ? "bg-yellow-500" : "bg-green-600"
                } text-white px-4 py-2 rounded-full hover:brightness-95`}
              >
                {editingId ? "Save" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
