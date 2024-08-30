import { useEffect, useState, useRef } from "react";
import "./App.css";
import AgoraRTM from "agora-rtm-sdk";

const APP_ID = import.meta.env.VITE_APP_ID;
let token = null,
  uid = String(Math.floor(Math.random() * 10000)),
  client,
  channel;

function App() {
  let [localStream, setLocalStream] = useState(null);
  let [remoteStream, setRemoteStream] = useState(null);
  let [peerConnection, setPeerConnection] = useState(null);
  const user1Ref = useRef();
  const user2Ref = useRef();

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

  let handleMessageFromPeer = async (message, MemberId) => {
    message = JSON.parse(message.text);
    console.log(`MESSAGE FROM PEER ${JSON.stringify(message)}`);
    if (message.type === "offer") {
      createAnswer(MemberId, message.offer);
    }
    if (message.type === "answer") {
      addAnswer(message.answer);
    }
    if (message.type === "candidate") {
      if (peerConnection) {
        peerConnection.addIceCandidate(message.candidate);
      }
    }
  };

  const handleUserJoined = (MemberId) => {
    console.log(`user joined ${MemberId}`);
    createOffer(MemberId);
  };

  const createOffer = async (MemberId) => {
    await createPeerConnection(MemberId);
    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer); // <- trigger generation of ice candidates

    //TODO: from here
    client.sendMessageToPeer(
      { text: JSON.stringify({ type: "offer", offer: offer }) },
      MemberId,
    );

    console.log(`offer: ${offer}`);
  };

  let createPeerConnection = async (MemberId) => {
    const pc = new RTCPeerConnection(servers);
    setPeerConnection(pc);
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
      if (pc || peerConnection) {
        pc.addTrack(track, localStream);
      } else {
        console.log(`PEERCONNECTION NOT FOUND TO ADD TRACKS`);
      }
    });

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    pc.onicecandidate = async (event) => {
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
    await createPeerConnection(MemberID);
    await peerConnection.setRemoteDescription(offer);
    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    client.sendMessageToPeer({
      text: JSON.stringify({ type: "answer", answer: answer }),
    });
  };

  const addAnswer = async (answer) => {
    //add receivd answer as remoteDesc
    if (!peerConnection.currentRemoteDescription) {
      await peerConnection.setRemoteDescription(answer);
    }
  };

  useEffect(() => {
    let init = async () => {
      alert("give perimsion");
      client = AgoraRTM.createInstance(APP_ID);
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
}

export default App;
