import { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  let [localStream, setLocalStream] = useState(null);
  let [remoteStream, setRemoteStream] = useState(null);
  let [peerConnection, setPeerConnection] = useState(null);
  const user1Ref = useRef();
  const user2Ref = useRef();
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
      const pc = new RTCPeerConnection();
      setPeerConnection(pc);

      const rstream = new MediaStream();
      user2Ref.current.srcObject = rstream;
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
