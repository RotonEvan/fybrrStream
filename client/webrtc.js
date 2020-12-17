// Generate random room name if needed
if (!location.hash) {
  location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
}
const roomHash = location.hash.substring(1);

// const server = require('../server/server');

// const WS_PORT = server.portnumber; //make sure this matches the port for the webscokets server

var localUuid;
var localDisplayName;
var localIsMute = false;
var localStream;
var serverConnection;
var peerConnections = {}; // key is uuid, values are peer connection object and user defined display name string
var localVideo;
let frontCam = true;
var constraints = {};

var peerConnectionConfig = {
  'iceServers': [
    { 'urls': 'stun:stun.stunprotocol.org:3478' },
    { 'urls': 'stun:stun.l.google.com:19302' },
  ]
};

function start() {
  // localUuid = createUUID();

  // check if "&displayName=xxx" is appended to URL, otherwise alert user to populate
  var urlParams = new URLSearchParams(window.location.search);
  localDisplayName = urlParams.get('displayName') || prompt('Enter your name', '');
  document.getElementById('localVideoContainer').appendChild(makeLabel(localDisplayName));
  document.getElementById('localVideoContainer').appendChild(makeAudioLabel(localIsMute));

  // localUuid = localDisplayName;

  // specify no audio for user media
  constraints = {
    // video: {
    //   width: {max: 320},
    //   height: {max: 240},
    //   frameRate: {max: 20},
    //   // facingMode: frontCam ? 'user' : 'environment',
    //   // facingMode: 'user',
    //   // facingMode: 'environment',
    // },
    video: {
      width: {ideal: 320},
      height: {ideal: 240},
      frameRate: {ideal: 20}
    },
    audio: {
      googEchoCancellation: true,
      googAutoGainControl: true,
      googNoiseSuppression: true,
      googHighpassFilter: true,
      googEchoCancellation2: true,
      googAutoGainControl2: true,
      googNoiseSuppression2: true
    }
  };





  if (navigator.mediaDevices.getUserMedia) {
    console.log("local video");
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        console.log("local stream");
        localStream = stream;
        document.getElementById('localVideo').srcObject = stream;
        localVideo = document.getElementById('localVideo');
      }).catch(errorHandler)

      .then(() => {
        serverConnection = new WebSocket('wss://' + location.host);
        serverConnection.onmessage = gotMessageFromServer;
        serverConnection.onopen = event => {
          serverConnection.send(JSON.stringify({ 'displayName': localDisplayName, 'isMute': localIsMute, 'room': roomHash, 'join': true }));
          console.log("joining request sent");
        }
      }).catch(errorHandler);
  }
  else {
    alert('Your browser does not support getUserMedia API');
  }
}


function gotMessageFromServer(message) {
  var signal = JSON.parse(message.data);
  var peerUuid = signal.uuid;
  var peerRoom = signal.room;

  // Ignore messages that are not for us or from ourselves
  // if (peerUuid == localUuid || (signal.dest != localUuid && peerRoom != roomHash)) return;
  //setting localuuid and starting localstream
  if (signal.setID) {
    localUuid = signal.id;
    serverConnection.send(JSON.stringify({ 'displayName': localDisplayName, 'isMute': localIsMute, 'uuid': localUuid, 'room': roomHash, 'dest': 'all' }));
  }

  if (signal.displayName && peerRoom == roomHash && signal.dest == 'all') {
    // set up peer connection object for a newcomer peer
    console.log(`newcomer peer: ${peerUuid}`);
    setUpPeer(peerUuid, signal.displayName, signal.isMute);
    serverConnection.send(JSON.stringify({ 'call': true, 'displayName': localDisplayName, 'isMute': localIsMute, 'uuid': localUuid, 'room': roomHash, 'dest': peerUuid }));

  } else if (signal.displayName && peerRoom == roomHash && signal.dest == localUuid) {
    // initiate call if we are the newcomer peer
    console.log(`call request from ${peerUuid} to ${localUuid}`);
    setUpPeer(peerUuid, signal.displayName, signal.isMute, true);
  } else if (signal.sdp) {
    console.log(`sdp: ${peerUuid}`);
    peerConnections[peerUuid].pc.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
      // Only create answers in response to offers
      if (signal.sdp.type == 'offer') {
        peerConnections[peerUuid].pc.createAnswer().then(description => createdDescription(description, peerUuid)).catch(errorHandler);
      }
    }).catch(errorHandler);

  } else if (signal.ice) {
    console.log(`ice: ${peerUuid}`);
    peerConnections[peerUuid].pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
  } else if (signal.dest == 'all-audio-change' && peerRoom == roomHash) {
    console.log("audio state change for peer : " + peerUuid);
    changeAudioLabel(peerUuid);
  }

  if (signal.remove) {
    delete peerConnections[peerUuid];
    document.getElementById('videos').removeChild(document.getElementById('remoteVideo_' + signal.id));
    updateLayout();
  }
}

function setUpPeer(peerUuid, displayName, isMute, initCall = false) {
  peerConnections[peerUuid] = { 'displayName': displayName, 'isMute': isMute, 'pc': new RTCPeerConnection(peerConnectionConfig) };
  peerConnections[peerUuid].pc.onicecandidate = event => gotIceCandidate(event, peerUuid);
  peerConnections[peerUuid].pc.ontrack = event => gotRemoteStream(event, peerUuid);
  peerConnections[peerUuid].pc.oniceconnectionstatechange = event => checkPeerDisconnect(event, peerUuid);
  localStream.getTracks().forEach(t => {
    peerConnections[peerUuid].pc.addTrack(t, localStream);
  });
  // peerConnections[peerUuid].pc.addStream(localStream);

  if (initCall) {
    console.log(`call inititated: ${peerUuid} to ${localUuid}`);
    peerConnections[peerUuid].pc.createOffer({iceRestart: true}).then(description => createdDescription(description, peerUuid)).catch(errorHandler);
  }
}

function gotIceCandidate(event, peerUuid) {
  if (event.candidate != null) {
    serverConnection.send(JSON.stringify({ 'ice': event.candidate, 'uuid': localUuid, 'dest': peerUuid }));
  }
}

function createdDescription(description, peerUuid) {
  console.log(`got description, peer ${peerUuid}`);
  peerConnections[peerUuid].pc.setLocalDescription(description).then(function () {
    serverConnection.send(JSON.stringify({ 'sdp': peerConnections[peerUuid].pc.localDescription, 'uuid': localUuid, 'dest': peerUuid }));
  }).catch(errorHandler);
}

function gotRemoteStream(event, peerUuid) {
  var videle = document.getElementById('remoteVideo_'+peerUuid);
  if(videle==null)
  {
    console.log(`got remote stream, peer ${peerUuid}`);
    //assign stream to new HTML video element
    var vidElement = document.createElement('video');
    vidElement.setAttribute('autoplay', '');
    vidElement.setAttribute('muted', '');
    vidElement.srcObject = event.streams[0];

    var vidContainer = document.createElement('div');
    vidContainer.setAttribute('id', 'remoteVideo_' + peerUuid);
    vidContainer.setAttribute('class', 'videoContainer');
    vidContainer.appendChild(vidElement);
    vidContainer.appendChild(makeLabel(peerConnections[peerUuid].displayName));
    vidContainer.appendChild(makeAudioLabel(peerConnections[peerUuid].isMute));

    document.getElementById('videos').appendChild(vidContainer);

    updateLayout();
  }
}

function checkPeerDisconnect(event, peerUuid) {
  var state = peerConnections[peerUuid].pc.iceConnectionState;
  console.log(`connection with peer ${peerUuid} ${state}`);
  if (state === "failed" || state === "closed") {
    delete peerConnections[peerUuid];
    document.getElementById('videos').removeChild(document.getElementById('remoteVideo_' + peerUuid));
    updateLayout();
  }
}

function updateLayout() {
  // update CSS grid based on number of diplayed videos
  var rowHeight = '98vh';
  var colWidth = '98vw';

  var numVideos = Object.keys(peerConnections).length + 1; // add one to include local video

  if(numVideos == 1)
  {
    var rowHeight = '92vh';
    var colWidth = '99.7vw';
    var rowHeightMob = '92vh';
    var colWidthMob = '99.7vw';
  }
  else if(numVideos == 2)
  {
    var rowHeight = '92vh';
    var colWidth = '49vw';
    var rowHeightMob = '46vh';
    var colWidthMob = '99.7vw';
  }
  else if(numVideos > 2 && numVideos < 5)
  {
    var rowHeight = '45vh';
    var colWidth = '49vw';
    var rowHeightMob = '45vh';
    var colWidthMob = '49vw';
  }
  else if(numVideos > 4 && numVideos < 7)
  {
    var rowHeight = '45.8vh';
    var colWidth = '33.1vw';
    var rowHeightMob = '30.9vh';
    var colWidthMob = '49vw';
  }
  else if(numVideos > 6 && numVideos < 10)
  {
    var rowHeight = '30.5vh';
    var colWidth = '33.1vw';
    var rowHeightMob = '22.9vh';
    var colWidthMob = '49vw';
  }
  else if(numVideos > 9 && numVideos < 13)
  {
    var rowHeight = '30.5vh';
    var colWidth = '24.79vw';
    var rowHeightMob = '18.5vh';
    var colWidthMob = '49vw';
  }
  else if(numVideos > 12 && numVideos < 17)
  {
    var rowHeight = '22.8vh';
    var colWidth = '24.79vw';
    var rowHeightMob = '18.5vh';
    var colWidthMob = '49vw';
  }
  else if(numVideos > 16 && numVideos < 21)
  {
    var rowHeight = '22.8vh';
    var colWidth = '19.74vw';
    var rowHeightMob = '18.5vh';
    var colWidthMob = '49vw';
  }
  else if(numVideos > 20)
  {
    var rowHeight = '22.8vh';
    var colWidth = '16.46vw';
    var rowHeightMob = '18.5vh';
    var colWidthMob = '49vw';
  }
    document.documentElement.style.setProperty(`--rowHeight`, rowHeight);
    document.documentElement.style.setProperty(`--colWidth`, colWidth);
    document.documentElement.style.setProperty(`--rowHeightMob`, rowHeightMob);
    document.documentElement.style.setProperty(`--colWidthMob`, colWidthMob);

}

function makeLabel(label) {
  var vidLabel = document.createElement('div');
  vidLabel.appendChild(document.createTextNode(label));
  vidLabel.setAttribute('class', 'videoLabel');
  return vidLabel;
}

function makeAudioLabel(label) {
  var vidLabel = document.createElement('div');
  var icon = document.createElement('i');
  icon.setAttribute('class', 'fa fa-microphone-slash');
  icon.setAttribute('aria-hidden', 'true');
  vidLabel.appendChild(icon);
  if (!label) {vidLabel.setAttribute('class', 'audioUnmute');}
  else  {vidLabel.setAttribute('class', 'audioMute');};
  vidLabel.setAttribute('id', 'audioStatus');
  return vidLabel;
}

function changeAudioLabel(peerUuid) {
  var vidElement = document.getElementById('remoteVideo_'+peerUuid).children[2];
  vidElement.classList.toggle('audioUnmute');
  vidElement.classList.toggle('audioMute');
}

function errorHandler(error) {
  console.log(error);
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function createUUID() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function toggleAudio() {
  document.getElementById('audio').classList.toggle('off');
  document.getElementById('audio').classList.toggle('on');
  document.getElementById('audioStatus').classList.toggle('audioUnmute');
  document.getElementById('audioStatus').classList.toggle('audioMute');
  localStream.getAudioTracks()[0].enabled = !(localStream.getAudioTracks()[0].enabled);
  localIsMute = !(localIsMute);
  serverConnection.send(JSON.stringify({ 'displayName': localDisplayName, 'isMute': localIsMute, 'uuid': localUuid, 'room': roomHash, 'dest': 'all-audio-change' }));
  console.log(localStream.getAudioTracks()[0].enabled);
};

function toggleVideo() {
  document.getElementById('video').classList.toggle('off');
  document.getElementById('video').classList.toggle('on');
  localStream.getVideoTracks()[0].enabled = !(localStream.getVideoTracks()[0].enabled);
  console.log(localStream.getVideoTracks()[0].enabled);
};
//
// // screenshare-start
//
// var displayMediaStreamConstraints = {
//   video: {
//       mandatory: {
//         chromeMediaSource: 'desktop',
//         maxWidth: 1920,
//         maxHeight: 1080,
//         maxFrameRate: 10,
//         minAspectRatio: 1.77,
//         // chromeMediaSourceId: chrome.desktopCapture.chooseDesktopMedia(),
//       }
//   },
//   audio: true
// }
//
//
// var button           = document.querySelector('#btn-test-getDisplayMedia');
//
// function screenshare() {
//     //this.disabled = true;
//
//     invokeGetDisplayMedia(function(screen) {
//         addStreamStopListener(screen, function() {
//             location.reload();
//         });
//         var video            = document.querySelector('video');
//         video.srcObject = screen;
//
//     }, function(e) {
//         //button.disabled = false;
//
//         var error = {
//             name: e.name || 'UnKnown',
//             message: e.message || 'UnKnown',
//             stack: e.stack || 'UnKnown'
//         };
//
//         if(error.name === 'PermissionDeniedError') {
//             if(location.protocol !== 'https:') {
//                 error.message = 'Please use HTTPs.';
//                 error.stack   = 'HTTPs is required.';
//             }
//         }
//
//         console.error(error.name);
//         console.error(error.message);
//         console.error(error.stack);
//
//         alert('Unable to capture your screen.\n\n' + error.name + '\n\n' + error.message + '\n\n' + error.stack);
//     });
// };
//
// if(!navigator.getDisplayMedia && !navigator.mediaDevices.getDisplayMedia) {
//     var error = 'Your browser does NOT supports getDisplayMedia API.';
//     document.querySelector('h1').innerHTML = error;
//     document.querySelector('h1').style.color = 'red';
//
//     document.querySelector('video').style.display = 'none';
//     button.style.display = 'none';
//     throw new Error(error);
// }
//
// function invokeGetDisplayMedia(success, error) {
//     var videoConstraints = {};
//
//         videoConstraints.width = 1280;
//         videoConstraints.height = 720;
//
//     var displayMediaStreamConstraints = {
//         video: videoConstraints,
//         audio: true
//     };
//
//     if(navigator.mediaDevices.getDisplayMedia) {
//         navigator.mediaDevices.getDisplayMedia(displayMediaStreamConstraints).then(success).catch(error);
//     }
//     else {
//         navigator.getDisplayMedia(displayMediaStreamConstraints).then(success).catch(error);
//     }
// }
//
// function addStreamStopListener(stream, callback) {
//     stream.addEventListener('ended', function() {
//         callback();
//         callback = function() {};
//     }, false);
//     stream.addEventListener('inactive', function() {
//         callback();
//         callback = function() {};
//     }, false);
//     stream.getTracks().forEach(function(track) {
//         track.addEventListener('ended', function() {
//             callback();
//             callback = function() {};
//         }, false);
//         track.addEventListener('inactive', function() {
//             callback();
//             callback = function() {};
//         }, false);
//     });
// }
// // screenshare-end

function toggleCamera() {
  localVideo.pause();
  localVideo.srcObject = null;
  if( localStream == null ) return;
  // we need to flip, stop everything
  // localStream.getTracks().forEach(t => {
  //   t.stop();
  // });
  localStream.getVideoTracks()[0].stop();
  frontCam = !(frontCam);
  flip();
}

function flip() {
  if (frontCam) {
    constraints.video = {
      width: {ideal: 320},
      height: {ideal: 240},
      frameRate: {ideal: 20}
    };
  } else {
    constraints.video = {
      width: {ideal: 320},
      height: {ideal: 240},
      frameRate: {ideal: 20},
      facingMode: "environment"
    };
  }
  navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        console.log("local stream");
        localStream = stream;
        for (var peer in peerConnections) {
          localStream.getTracks().forEach(t => {
            peerConnections[peer].pc.addTrack(t, localStream);
          });
          console.log("sender: " + sender);
          sender.replaceTrack(videoTrack);
          sender.replaceTrack(audioTrack);
        }
        console.log("stream updated");
        localVideo.srcObject = stream;
        localVideo.play();
      }).catch(errorHandler);
}

function leaveRoom() {
  if (confirm("Leave meeting?")) {
    window.location = "https://p2p-vid-chat.herokuapp.com";
  }
}