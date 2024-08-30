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

  useEffect(() => {
    let handleMessageFromPeer = async (message, MemberId) => {
      message = JSON.parse(message.text);
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

    const addAnswer = async () => {};
    const createAnswer = async (MemberID) => {};

    const createOffer = async (MemberId) => {
      const pc = new RTCPeerConnection(servers);
      setPeerConnection(pc);

      const rstream = new MediaStream();
      user2Ref.current.srcObject = rstream;

      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
      //for the 2nd video to have remote conn's output
      pc.ontrack = (ev) => {
        ev.streams[0].getTracks().forEach((track) => {
          rstream.addTrack(track);
        });
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          client.sendMessageToPeer(
            {
              text: JSON.stringify({
                type: "candidate",
                candidate: ev.candidate,
              }),
            },
            MemberId,
          );
        }
      };

      let offer = await pc.createOffer();
      await pc.setLocalDescription(offer); // <- trigger generation of ice candidates

      //TODO: from here
      client.sendMessageToPeer(
        { text: JSON.stringify({ type: "offer", offer: offer }) },
        MemberId,
      );

      console.log(`offer: ${offer}`);
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
}

export default App;
