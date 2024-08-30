let localStream;
let remoteStream;

let init = async () => {
  alert("give perimsion");
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  document.getElementById("user-1").srcObject = localStream;
};
init();
