import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";
import "../Lobby.css";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      socket.emit("room:join", { email, room });
    },
    [email, room, socket],
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { email, room } = data;
      navigate(`/room/${room}`);
    },
    [navigate],
  );

  useEffect(() => {
    //NOTE: listeners in useEffect
    if (socket) {
      socket.on("room:join", handleJoinRoom);
    }

    return () => {
      socket.off("room:join");
    };
  }, [socket, handleJoinRoom]);

  return (
    <main id="lobby-container">
      <div id="form-container">
        <div id="form__container__header">
          <p>👋 Create OR Join a Room</p>
        </div>

        <div id="form__content__wrapper">
          <form id="join-form" onSubmit={handleSubmitForm}>
            <input
              type="text"
              name="invite_link"
              placeholder="enter name"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="enter roomId"
              required
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
            <button type="submit">Join</button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default LobbyScreen;
