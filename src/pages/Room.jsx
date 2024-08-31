import React, { useRef, useState, useEffect } from "react";
import { useSocket } from "../context/SocketProvider.jsx";

const Room = () => {
  let [localStream, setLocalStream] = useState(null);
  let [remoteStream, setRemoteStream] = useState(null);
  // let [peerConnection, setPeerConnection] = useState(null);
  const user1Ref = useRef();
  const user2Ref = useRef();
  const socket = useSocket();

  //NOTE: stun servers not needed in dev, but in prod
  const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
  };

  useEffect(() => {
    socket.on("user:joined", ({ email, id }) => {
      console.log(`user joined ${email}`);
      //TODO: toast notifications
    });
    //FIX: socket is not used here
    let peerConnection, client;
    let init = async () => {
      alert("give perimsion");
      client = await AgoraRTM.createInstance(APP_ID);
      await client.login({ uid, token });

      //://home/:roomId
      channel = client.createChannel("main");
      await channel.join();
      channel.on("MemberJoined", handleUserJoined);

      client.on("MessageFromPeer", handleMessageFromPeer);

      const lstream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(lstream);
      if (lstream) {
        user1Ref.current.srcObject = lstream;
      }
    };
    init();

    let handleMessageFromPeer = (message, MemberId) => {
      (async () => {
        message = JSON.parse(message.text);
        if (message.type === "offer") {
          createAnswer(MemberId, message.offer);
        }
        if (message.type === "answer") {
          console.log(
            `------------ANSWER RECEIVED; SETTING ANSWER------------------`,
          );
          addAnswer(message.answer);
        }
        if (message.type === "candidate") {
          if (peerConnection) {
            peerConnection.addIceCandidate(message.candidate);
          }
        }
      })();
    };

    const handleUserJoined = (MemberId) => {
      (async () => {
        console.log(`user joined ${MemberId}`);
        await createOffer(MemberId);
      })();
    };

    const createOffer = async (MemberId) => {
      await createPeerConnection(MemberId);
      let offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer); // <- trigger generation of ice candidates

      //TODO: peerDesc was null
      client.sendMessageToPeer(
        { text: JSON.stringify({ type: "offer", offer: offer }) },
        MemberId,
      );

      console.log(`offer: ${offer}`);
    };

    let createPeerConnection = async (MemberId) => {
      peerConnection = new RTCPeerConnection(servers);
      // setPeerConnection(pc);
      remoteStream = new MediaStream();
      user2Ref.srcObject = remoteStream;

      if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        user1Ref.current.srcObject = localStream;
      }

      localStream.getTracks().forEach((track) => {
        if (peerConnection) {
          peerConnection.addTrack(track, localStream);
        } else {
          console.log(`PEERCONNECTION NOT FOUND TO ADD TRACKS`);
        }
      });

      peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      };

      peerConnection.onicecandidate = async (event) => {
        console.log(`-----------obatined new ice,sending`);
        if (event.candidate) {
          client.sendMessageToPeer(
            {
              text: JSON.stringify({
                type: "candidate",
                candidate: event.candidate,
              }),
            },
            MemberId,
          );
        }
      };
    };

    const createAnswer = async (MemberID, offer) => {
      console.log(`CREATEANSWER TRIGGERED ${offer}`);
      await createPeerConnection(MemberID);
      await peerConnection.setRemoteDescription(offer);
      let answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await client.sendMessageToPeer({
        text: JSON.stringify({ type: "answer", answer: answer }),
      });
    };

    const addAnswer = async (answer) => {
      //add receivd answer as remoteDesc
      if (!peerConnection.currentRemoteDescription) {
        console.log(`answer received==>setting remoteDesc `);
        await peerConnection.setRemoteDescription(answer);
      }
    };
  }, []);
  return (
    <>
      <p>video-player</p>
      <div id="videos">
        <video
          ref={user1Ref}
          className="video-player"
          id="user-1"
          autoPlay
          playsInline
        ></video>
        <video
          ref={user2Ref}
          className="video-player"
          id="user-2"
          autoPlay
          playsInline
        ></video>
      </div>
    </>
  );
};

export default Room;
