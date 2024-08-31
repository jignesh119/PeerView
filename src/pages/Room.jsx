import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketProvider.jsx";
import { toast } from "react-hot-toast";
import { useCallback } from "react";
import ReactPlayer from "react-player";
import peer from "../services/peer.js";

const Room = () => {
  let [myStream, setMyStream] = useState(null);
  let [remoteStream, setRemoteStream] = useState(null);
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`user joined ${email}`);
    toast.success(`${email} joined`);
    setRemoteSocketId(id);
  }, []);
  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);
  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    console.log(`incoming call`);
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setMyStream(stream);
    const ans = await peer.getAnswer(offer);
    socket.emit("call:accepted", { to: from, answer: ans });
  }, []);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket],
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  const sendStreams = useCallback(() => {
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);
  const handleCallAccepted = useCallback(
    async ({ from, answer }) => {
      await peer.setLocalDescription(answer);
      console.log(
        `call accepted sucxfuli set remote desc ${JSON.stringify(answer)}`,
      );
      sendStreams();
    },
    [sendStreams],
  );

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log(`got streams`);
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:join", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);

    return () => {
      socket.off("user:join", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
  ]);

  return (
    <>
      {!myStream && !remoteStream && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div>
            <h1>PeerView</h1>
            <br />
            <h3>No Peers in room</h3>
            <br />
            <h4>share invite to let users in</h4>
            <br />
            <button onClick={handleCallUser}>Video-Call</button>
          </div>
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {myStream && <button onClick={sendStreams}>Share Video</button>}
      </div>
      <div
        style={{
          marginLeft: "70px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", gap: "15px" }}>
          {myStream && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h5 style={{ textAlign: "center" }}>My Stream</h5>
              <ReactPlayer
                width="600px"
                height="500px"
                url={myStream}
                playing
                muted
                id="user-1"
              />
            </div>
          )}
          {remoteStream && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h5 style={{ textAlign: "center" }}>Remote Stream</h5>
              <ReactPlayer
                width="600px"
                height="500px"
                url={remoteStream}
                playing
                muted
                id="user-2"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Room;
