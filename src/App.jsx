import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import WhatsAppChatBox from "./components/ChatBox";
import { FaPlus } from "react-icons/fa6";
import { FaKey } from "react-icons/fa";
import { FaCloud } from "react-icons/fa";
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [mode, setMode] = useState(null); // "create" or "join"

  useEffect(() => {
    const s = io(SOCKET_URL, { transports: ["websocket"] });
    setSocket(s);

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    return () => s.disconnect();
  }, []);

  const handleJoinOrCreate = () => {
    if (!username.trim() || !room.trim()) return alert("Enter name & room");
    socket?.emit("join", { username, room });
    setJoined(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">      
      <div className="bg-green-600 text-white py-4 shadow text-center w-full sm:w-[90%] md:w-[70%] mx-auto rounded-b-3xl flex justify-center gap-2">
        <h1 className=" text-3xl"><FaCloud/></h1>
        <h1 className="text-2xl font-semibold"> Group Chat</h1>
      </div>
      
      <div className="flex-1 flex justify-center items-center px-3 py-5 overflow-hidden">
        {!joined ? (          
          <div className="bg-white w-full max-w-md shadow-xl rounded-2xl p-8 flex flex-col gap-6 items-center text-center">
            {!mode ? (
              <>
                <h2 className="text-2xl font-bold text-green-700">
                  Welcome to Group Chat
                </h2>
                <p className="text-gray-600">Choose an option to continue:</p>
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button
                    onClick={() => setMode("create")}
                    className="flex-1 p-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition relative"
                  >
                    <div>
                      <div className="absolute top-[30%]"><FaPlus/></div>
                      <div>Create Room</div>
                    </div>
                     
                  </button>
                  <button
                    onClick={() => setMode("join")}
                    className="flex-1 p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition relative "
                  >
                    <div className="absolute top-[30%]"><FaKey className="text-yellow-300"/></div> Join Room
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-green-700">
                  {mode === "create" ? "Create New Room" : "Join Existing Room"}
                </h2>

                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />

                <input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder={
                    mode === "create" ? "Enter new room ID" : "Enter existing room ID"
                  }
                  className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                />

                <button
                  onClick={handleJoinOrCreate}
                  className="w-full p-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  {mode === "create" ? "Create & Join" : "Join Room"}
                </button>

                <button
                  onClick={() => setMode(null)}
                  className="text-sm text-gray-500 hover:text-green-600 mt-2 underline"
                >
                  ← Back
                </button>

                <div className="text-sm text-gray-600">
                  Status:{" "}
                  <span
                    className={`font-semibold ${
                      connected ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {connected ? "Online" : "Offline"}
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (

          <div className="w-full max-w-6xl h-[85vh]">
            <WhatsAppChatBox
              socket={socket}
              username={username}
              room={room}
              onLeave={() => {
                socket?.emit("leave", { username, room });
                setJoined(false);
                setMode(null);
                setRoom("");
              }}
              connected={connected}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
