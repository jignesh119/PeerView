import { useEffect, useState, useRef } from "react";
import "./App.css";

const APP_ID = import.meta.env.VITE_APP_ID;
const token = null,
  uid = String(math.floor(Math.random() * 10000));

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
    let init = async () => {
      alert("give perimsion");
      const lstream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      setLocalStream(lstream);
      if (localStream) {
        user1Ref.current.srcObject = lstream;
      }
    };
    init();
    const createOffer = async () => {
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
          console.log(`ice candidate: ${ev.candidate.candidate}`);
        }
      };

      let offer = await pc.createOffer();
      await pc.setLocalDescription(offer); // <- trigger generation of ice candidates

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
