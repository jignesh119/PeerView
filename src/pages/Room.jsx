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

    //FIX: socket is not used here

    // let peerConnection, client;
    // let init = async () => {
    //   alert("give perimsion");
    //   client = await AgoraRTM.createInstance(APP_ID);
    //   await client.login({ uid, token });
    //
    //   //://home/:roomId
    //   channel = client.createChannel("main");
    //   await channel.join();
    //   channel.on("MemberJoined", handleUserJoined);
    //
    //   client.on("MessageFromPeer", handleMessageFromPeer);
    //
    //   const lstream = await navigator.mediaDevices.getUserMedia({
    //     video: true,
    //     audio: true,
    //   });
    //   setLocalStream(lstream);
    //   if (lstream) {
    //     user1Ref.current.srcObject = lstream;
    //   }
    // };
    // init();
    //
    // let handleMessageFromPeer = (message, MemberId) => {
    //   (async () => {
    //     message = JSON.parse(message.text);
    //     if (message.type === "offer") {
    //       createAnswer(MemberId, message.offer);
    //     }
    //     if (message.type === "answer") {
    //       console.log(
    //         `------------ANSWER RECEIVED; SETTING ANSWER------------------`,
    //       );
    //       addAnswer(message.answer);
    //     }
    //     if (message.type === "candidate") {
    //       if (peerConnection) {
    //         peerConnection.addIceCandidate(message.candidate);
    //       }
    //     }
    //   })();
    // };
    //
    // const handleUserJoined = (MemberId) => {
    //   (async () => {
    //     console.log(`user joined ${MemberId}`);
    //     await createOffer(MemberId);
    //   })();
    // };
    //
    // const createOffer = async (MemberId) => {
    //   await createPeerConnection(MemberId);
    //   let offer = await peerConnection.createOffer();
    //   await peerConnection.setLocalDescription(offer); // <- trigger generation of ice candidates
    //
    //   //TODO: peerDesc was null
    //   client.sendMessageToPeer(
    //     { text: JSON.stringify({ type: "offer", offer: offer }) },
    //     MemberId,
    //   );
    //
    //   console.log(`offer: ${offer}`);
    // };
    //
    // let createPeerConnection = async (MemberId) => {
    //   peerConnection = new RTCPeerConnection(servers);
    //   // setPeerConnection(pc);
    //   remoteStream = new MediaStream();
    //   user2Ref.srcObject = remoteStream;
    //
    //   if (!localStream) {
    //     localStream = await navigator.mediaDevices.getUserMedia({
    //       video: true,
    //       audio: false,
    //     });
    //     user1Ref.current.srcObject = localStream;
    //   }
    //
    //   localStream.getTracks().forEach((track) => {
    //     if (peerConnection) {
    //       peerConnection.addTrack(track, localStream);
    //     } else {
    //       console.log(`PEERCONNECTION NOT FOUND TO ADD TRACKS`);
    //     }
    //   });
    //
    //   peerConnection.ontrack = (event) => {
    //     event.streams[0].getTracks().forEach((track) => {
    //       remoteStream.addTrack(track);
    //     });
    //   };
    //
    //   peerConnection.onicecandidate = async (event) => {
    //     console.log(`-----------obatined new ice,sending`);
    //     if (event.candidate) {
    //       client.sendMessageToPeer(
    //         {
    //           text: JSON.stringify({
    //             type: "candidate",
    //             candidate: event.candidate,
    //           }),
    //         },
    //         MemberId,
    //       );
    //     }
    //   };
    // };
    //
    // const createAnswer = async (MemberID, offer) => {
    //   console.log(`CREATEANSWER TRIGGERED ${offer}`);
    //   await createPeerConnection(MemberID);
    //   await peerConnection.setRemoteDescription(offer);
    //   let answer = await peerConnection.createAnswer();
    //   await peerConnection.setLocalDescription(answer);
    //
    //   await client.sendMessageToPeer({
    //     text: JSON.stringify({ type: "answer", answer: answer }),
    //   });
    // };
    //
    // const addAnswer = async (answer) => {
    //   //add receivd answer as remoteDesc
    //   if (!peerConnection.currentRemoteDescription) {
    //     console.log(`answer received==>setting remoteDesc `);
    //     await peerConnection.setRemoteDescription(answer);
    //   }
    // };
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
      <p>video-player</p>
      {myStream && <button onClick={sendStreams}>Send Stream</button>}
      <p>{remoteSocketId ? "Connected" : "No one in room"}</p>
      <div>
        {myStream && (
          <ReactPlayer
            width="400px"
            height="300px"
            url={myStream}
            playing
            muted
          />
        )}
        {remoteStream && (
          <ReactPlayer
            width="300px"
            height="200px"
            url={remoteStream}
            playing
            muted
          />
        )}
      </div>
      <button onClick={handleCallUser}>Call</button>
    </>
  );
};

export default Room;
