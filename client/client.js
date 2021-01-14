// Generate random room name if needed
if (!location.hash) {
    location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
}
const roomHash = location.hash.substring(1);

// variable initializations

var uuid;
var displayName;
// var isMute = false;
var localStream;
var relayStream;

var score;
var limit;
var slots;
var failCount = 0;

var isSource = false;

var socketConnection;

var parentConnection;
var childrenConnections = {};
var peerConnections = {};
var peers = {};     // full mesh - peer IDs

var constraints = {};

var peerConnectionConfig = {
    'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' },
        { 'urls': 'stun:stun1.l.google.com:19302' },
        { 'urls': 'stun:stun2.l.google.com:19302' },
        // { 'urls': 'stun:stun3.l.google.com:19302' },
        // { 'urls': 'stun:stun4.l.google.com:19302' },
        // { 'urls': 'stun:stun.ekiga.net' },
        // { 'urls': 'stun:stun.ideasip.com' },
        // { 'urls': 'stun:stun.rixtelecom.se' },
        // { 'urls': 'stun:stun.schlund.de' },
        {
            "url": "stun:global.stun.twilio.com:3478?transport=udp",
            "urls": "stun:global.stun.twilio.com:3478?transport=udp"
        },
        {
//             "url": "turn:global.turn.twilio.com:3478?transport=udp",
            "urls": "turn:global.turn.twilio.com:3478",
            "username": "b5739587f71d43b4074282fa448416b3dd38b0cd6fde818a59d43efe138c440e",
            "credential": "kUkzUgZ+tefN2nNACeAWmyFgyLK9oLEEi+DhgsMC0fY="
        },
//           {
//             "url": "turn:global.turn.twilio.com:3478?transport=tcp",
//             "username": "4c25833b3b5abb4c9f98e34d591edf5e75ec97703113867a52f4f2d93dfbc087",
//             "urls": "turn:global.turn.twilio.com:3478?transport=tcp",
//             "credential": "EUFiUeGErhXy6plXhbcMXmcgArgKo1/dR9H+za30dyg="
//           },
        {
//             "url": "turn:global.turn.twilio.com:443?transport=tcp",
            "urls": "turn:global.turn.twilio.com:443",
            "username": "b5739587f71d43b4074282fa448416b3dd38b0cd6fde818a59d43efe138c440e",
            "credential": "kUkzUgZ+tefN2nNACeAWmyFgyLK9oLEEi+DhgsMC0fY="
        },
        { 'urls': 'stun:stun.stunprotocol.org:3478' }
        // { 'urls': 'stun:stun.voiparound.com' },
        // { 'urls': 'stun:stun.voipbuster.com' },
        // { 'urls': 'stun:stun.voipstunt.com' },
        // { 'urls': 'stun:stun.voxgratia.org' }
    ]
};

var peerLogFileData = {};    // key : uuid, value : timestamped log object
var peerData = []; // Stores the information about the client
var logFlag = false;

// peerLogFileData = 

// roton-sak : [ 
//   {t1 : {relevant_data}}
//   {t2 : {...}}
// ]

// roton-prashant :
//   t1 : {...}
//   t2 : {...}


function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function init() {
    displayName = prompt("Enter your name: ");

    // set UUID
    uuid = displayName + "_" + create_UUID();

    // calculate and set limit
    limit = prompt("Enter Limit: ");
    // limit = 2;
    slots = limit;

    // calculate and set score
    score = prompt("Enter Score: ");
    // score = 4;

    constraints = {
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
        },
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    };


    peerData.push({'joining_timestamp':new Date().getTime(), 'available_slots' : slots});
    // setting up socket connection
    socketConnection = new WebSocket('wss://' + location.host);
    socketConnection.onmessage = messageHandler;
    socketConnection.onopen = event => {
        sendMessage(uuid, 'server', 'JOIN', JSON.stringify({'roomID' : roomHash, 'score' : score, 'limit' : limit}));
    }
}

function messageHandler(message) {
    // console.log(message);
    var signal = JSON.parse(message.data);
    var context = signal.context;

    if (context != 'ICE' && context != 'SDP') {
        console.log(signal);
    }

    if (context == 'SOURCE') {
        isSource = true;

        if (navigator.mediaDevices.getUserMedia) {
            console.log("local video");
            navigator.mediaDevices.getUserMedia(constraints)
              .then(stream => {
                console.log("local stream");
                localStream = stream;
                // localStream.getAudioTracks()[0].enabled = false;
                document.getElementById('localVideo').srcObject = stream;
                localVideo = document.getElementById('localVideo');
              }).catch(errorHandler);
        }
        else {
            alert('Your browser does not support getUserMedia API');
        }
        
    }
    else if (context == 'DIRECTCHILDOFSOURCE') {
        console.log("Child of Source");
        var data = JSON.parse(signal.data);
        var peer = data.parent;
        if (parentConnection){
            delete peerConnections[parentConnection];
        }
        parentConnection = peer;
        // RTC Connection setup starts with CONNECT request - sender is Child, receiver is Parent
        sendMessage(uuid, peer, 'CONNECT', JSON.stringify({'roomID' : roomHash}));
    }
    else if (context == 'DIRECTCHILDOFSOURCEANDREPLACE') {
        console.log("Child of Source");
        var data = JSON.parse(signal.data);
        var peer = data.parent;
        var minNodeID = data.child;
        if (parentConnection){
            delete peerConnections[parentConnection];
        }
        parentConnection = peer;
        // RTC Connection setup starts with CONNECT request - sender is Child, receiver is Parent
        sendMessage(uuid, peer, 'CONNECT', JSON.stringify({'roomID' : roomHash}));
        function checkLocalStream() {
            if (!(localStream)) {
                window.setTimeout(checkLocalStream, 5000);
            }
            else {
                sendMessage(uuid, minNodeID, 'PARENT', JSON.stringify({'peer' : uuid, 'roomID' : roomHash}));
                sendMessage(uuid, 'server', 'ADJLIST', JSON.stringify({'newparent' : uuid, 'roomID' : roomHash, 'oldparent' : minNodeID}))
            }
        }
        checkLocalStream();
    }
    else if (context == 'PARENT') {
        var data = JSON.parse(signal.data);
        var peer = data.peer;
        console.log(`Parent : ${peer}`);
        // RTC Connection setup starts with CONNECT request - sender is Child, receiver is Parent
        sendMessage(uuid, peer, 'CONNECT', JSON.stringify({'roomID' : roomHash}));
        if (parentConnection){
            delete peerConnections[parentConnection];
        }
        parentConnection = peer;
    }
    else if (context == 'CONNECT') {
        var peer = signal.from;
        console.log(`Connect request from Child : ${peer}`);
        // setInterval(() => {
            // Wait till localStream is set
            while (!(localStream)) {}
        // });
        if (!(peer in peerConnections)){
            --slots;
            peerData.push({'timestamp':new Date().getTime(),'Type':'child_added', 'available_slots' : slots, 'child_id':peer});
        }
        setUpPeer(peer, true);
        // sending CONNECT_ACK response
        sendMessage(uuid, peer, 'CONNECT_ACK', JSON.stringify({'roomID' : roomHash}));
    }
    else if (context == 'CONNECT_ACK') {
        var peer = signal.from;
        console.log(`Connection ACK from parent : ${peer}`);
        setUpPeer(peer);
    }
    else if (context == 'SDP') {
        var data = JSON.parse(signal.data);
        var sdp = data.sdp;
        var peer = signal.from;
        console.log(`received sdp from peer : ${peer}`);
        peerConnections[peer].pc.setRemoteDescription(new RTCSessionDescription(sdp)).then(function () {
            if (sdp.type == 'offer') {
                peerConnections[peer].pc.createAnswer().then(description => createdDescription(description, peer)).catch(errorHandler);
            }
        });
    }
    else if (context == 'ICE') {
        var data = JSON.parse(signal.data);
        var ice = data.ice;
        var peer = signal.from;
        console.log(`received ice from peer : ${peer}`);
        peerConnections[peer].pc.addIceCandidate(new RTCIceCandidate(ice)).catch(errorHandler);
    }
    else if (context == 'CHILDLEFT') {
        var data = JSON.parse(signal.data);
        var c = data.child;
        if (peerConnections[c]){
            peerConnections[c].pc.close();
            delete peerConnections[c];
        }
        ++slots;
        peerData.push({'timestamp':new Date().getTime(),'Type':'child_left', 'available_slots' : slots, 'child_id':c});
    }
    else if (context == 'PARENTLEFT') {
        var data = JSON.parse(signal.data);
        var p = data.parent;
        if (peerConnections[p]){
            peerConnections[p].pc.close();
            delete peerConnections[p];
        }
    }
    else if (context == 'NODETIMESTAMPDATA'){
        console.log("Timestamp Data received");
        var data = JSON.parse(signal.data);
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", "Peer-" + uuid + "_node_timestamp.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
}

async function setUpPeer(peer, initCall = false) {
    peerConnections[peer] = { 'id': peer, 'pc': new RTCPeerConnection(peerConnectionConfig) };
    peerConnections[peer].pc.onicecandidate = event => gotIceCandidate(event, peer);
    peerConnections[peer].pc.ontrack = event => gotRemoteStream(event, peer);
    peerConnections[peer].pc.oniceconnectionstatechange = event => checkPeerDisconnect(event, peer);
    
    if (initCall) {
        console.log('adding tracks');
        localStream.getTracks().forEach(async function(t) {
            await peerConnections[peer].pc.addTrack(t, localStream);
        });
        console.log(`call inititated: ${uuid} to ${peer}`);
        peerConnections[peer].pc.createOffer({iceRestart: true}).then(description => createdDescription(description, peer)).catch(errorHandler);
        // peerConnections[peer].pc.addStream(localStream);
    }
}
  
function gotIceCandidate(event, peer) {
    console.log(`ice: ${uuid} to ${peer}`);
    if (event.candidate != null) {
        sendMessage(uuid, peer, 'ICE', JSON.stringify({'ice' : event.candidate, 'roomID' : roomHash}));
    }
}
  
function createdDescription(description, peer) {
    console.log(`created description for peer : ${peer}`);
    peerConnections[peer].pc.setLocalDescription(description).then(function () {
        sendMessage(uuid, peer, 'SDP', JSON.stringify({'sdp' : peerConnections[peer].pc.localDescription, 'roomID' : roomHash}));
    }).catch(errorHandler);
}

setInterval(() => {
  if (logFlag) {
    // var dt = new Date().getTime();
    for (const peer_id in peerConnections) {
      if (Object.hasOwnProperty.call(peerConnections, peer_id)) {
        const element = peerConnections[peer_id];
        if (!(peerLogFileData[peer_id])) {
          peerLogFileData[peer_id] = [];
        }
        // var sender = element.pc.getSenders()[0];
        // logFlag = false;
        element.pc.getStats().then(function (report) {
          // console.log(report);
          // console.log(report.values());
          var relevant_data = {};
          for (const i of report.values()) {
//             console.log(i);
            // console.log(i.type
            if (i.type === 'inbound-rtp'){
                relevant_data['from'] = peer_id;
                relevant_data['to'] = uuid;
                // dt = i.timestamp;
                if (i.kind === 'audio') {
                    relevant_data['Audio'] = {'timestamp':i.timestamp, 'packetsReceived' : i.packetsReceived, 'packetsLost' : i.packetsLost};
                } 
                else if (i.kind === 'video') {
                    relevant_data['Video'] = {'timestamp':i.timestamp, 'packetsReceived' : i.packetsReceived, 'packetsLost' : i.packetsLost};
                }
            }
            else if (i.type === 'remote-inbound-rtp') {
                // dt = i.timestamp;
                relevant_data['from'] = uuid;
                relevant_data['to'] = peer_id;
                if (i.kind === 'audio') {
                    relevant_data['Audio'] = {'timestamp':i.timestamp, 'roundTripTime' : i.roundTripTime, 'jitter' : i.jitter};
                } 
                else if (i.kind === 'video') {
                    relevant_data['Video'] = {'timestamp':i.timestamp, 'roundTripTime' : i.roundTripTime, 'jitter' : i.jitter};
                }
            }
            else{
                continue;
            }
            relevant_data['Type'] = i.type;
//             console.log(i);
            
            // var data = {'timestamp' : dt, 'data' : relevant_data};
//             console.log(relevant_data);
            peerLogFileData[peer_id].push(relevant_data);
          }
        })
      }
    }
  }
}, 5000);
  
function gotRemoteStream(event, peer) {
    var vidElement = document.getElementById('localVideo');
    vidElement.srcObject = event.streams[0];
//     if (localStream) {
//         localStream.getVideoTracks()[0].stop();
//     }
    localStream = event.streams[0];
    console.log(localStream);

    if (Object.keys(peerConnections).length > 1) {
        console.log("updating localstream for childpeers");
        for (var p in peerConnections) {
            if (p == parentConnection)   continue;
            var sender = peerConnections[p].pc.getSenders().find(function(s) {
              return s.track.kind == localStream.getVideoTracks()[0].kind;
            });
            console.log("sender: " + sender);
            sender.replaceTrack(localStream.getVideoTracks()[0]);
        }
        
    }
    // if (parentConnection){
    //     delete peerConnections[parentConnection];
    // }
    parentConnection = peer;
    
    
    if (logFlag == false) {
        var media_timestamp = new Date().getTime();
        peerData.push({'media_timestamp':media_timestamp});
        logFlag = true;
    }
}
  
function checkPeerDisconnect(event, peer) {
    if (peerConnections[peer]){
        var state = peerConnections[peer].pc.iceConnectionState;
        console.log(`connection with peer ${peer} ${state}`);
        if (state === "failed" || state === "closed") {
            sendMessage(uuid, 'server', "FAIL", JSON.stringify({'roomID' : roomHash, 'node' : peer}));
            delete peerConnections[peer];
            // document.getElementById('videos').removeChild(document.getElementById('remoteVideo_' + peer));
            // updateLayout();
        }
    } 
}

// Call this method when user clicks on the "Leave Meeting" button.
function sendLeavingRequest(){
    console.log("I am leaving!");
    sendMessage(uuid, 'server', "LEAVE", JSON.stringify({'roomID' : roomHash}));
    delete peerConnections[uuid];
    location.replace("https://fybrrStream/home.html");
}

function errorHandler(error) {
    console.log(error);
}

function sendMessage (from, to, context, data) {
    socketConnection.send(JSON.stringify({'from' : from, 'to' : to, 'context' : context, 'data' : data}));
}

function downloadFiles() {
    let element = peerData;
    downloadData(element);

    if (isSource){
        sendMessage(uuid, 'server', "GETNODETIMESTAMPDATA", JSON.stringify({'roomID' : roomHash}));
    }
    else{
        element = peerLogFileData;
        downloadData(element, "_connections");
    }
  }

  function downloadData(element, file_name_suffix = ""){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(element));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "Peer-" + uuid + file_name_suffix + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }





  var displayMediaStreamConstraints = {
    video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          maxWidth: 1920,
          maxHeight: 1080,
          maxFrameRate: {ideal: 25},
          minAspectRatio: 1.77,
          // chromeMediaSourceId: chrome.desktopCapture.chooseDesktopMedia(),
        }
    },
    audio: true
  }
  
  
  var button           = document.querySelector('#btn-test-getDisplayMedia');
  
  function screenshare() {
      //this.disabled = true;
  
      invokeGetDisplayMedia(function(screen) {
          addStreamStopListener(screen, function() {
              //location.reload();
              reReplaceVideo();
          });
          var video            = document.querySelector('video');
          video.srcObject = screen;
          for (var peer in peerConnections) {
                var sender = peerConnections[peer].pc.getSenders().find(function(s) {
                  return s.track.kind == localStream.getVideoTracks()[0].kind;
                });
                console.log("sender: " + sender);
                sender.replaceTrack(screen.getVideoTracks()[0]);}
      }, function(e) {
          //button.disabled = false;
  
          var error = {
              name: e.name || 'UnKnown',
              message: e.message || 'UnKnown',
              stack: e.stack || 'UnKnown'
          };
  
          if(error.name === 'PermissionDeniedError') {
              if(location.protocol !== 'https:') {
                  error.message = 'Please use HTTPs.';
                  error.stack   = 'HTTPs is required.';
              }
          }
  
          console.error(error.name);
          console.error(error.message);
          console.error(error.stack);
  
          alert('Unable to capture your screen.\n\n' + error.name + '\n\n' + error.message + '\n\n' + error.stack);
      });
  
  
    if(!navigator.getDisplayMedia && !navigator.mediaDevices.getDisplayMedia) {
        var error = 'Your browser does NOT supports getDisplayMedia API.';
        document.querySelector('h1').innerHTML = error;
        document.querySelector('h1').style.color = 'red';
  
        document.querySelector('video').style.display = 'none';
        button.style.display = 'none';
        throw new Error(error);
    }
  
  };
  function reReplaceVideo(){
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      console.log("local stream");
      localStream = stream;
      for (var peer in peerConnections) {
            var sender = peerConnections[peer].pc.getSenders().find(function(s) {
              return s.track.kind == localStream.getVideoTracks()[0].kind;
            });
            console.log("sender: " + sender);
            sender.replaceTrack(localStream.getVideoTracks()[0]);}
  
      console.log("stream updated");
      localVideo.srcObject = stream;
      localVideo.play();
    }).catch(errorHandler);
  
  };
  function invokeGetDisplayMedia(success, error) {
      var videoConstraints = {};
  
          videoConstraints.width = 1280;
          videoConstraints.height = 720;
  
      var displayMediaStreamConstraints = {
          video: videoConstraints,
          audio: true
      };
  
      if(navigator.mediaDevices.getDisplayMedia) {
          navigator.mediaDevices.getDisplayMedia(displayMediaStreamConstraints).then(success).catch(error);
      }
      else {
          navigator.getDisplayMedia(displayMediaStreamConstraints).then(success).catch(error);
      }
  
  }
  
  function addStreamStopListener(stream, callback) {
      stream.addEventListener('ended', function() {
          callback();
          callback = function() {};
      }, false);
      stream.addEventListener('inactive', function() {
          callback();
          callback = function() {};
      }, false);
      stream.getTracks().forEach(function(track) {
          track.addEventListener('ended', function() {
              callback();
              callback = function() {};
          }, false);
          track.addEventListener('inactive', function() {
              callback();
              callback = function() {};
          }, false);
      });
  }
  // screenshare-end   

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
      window.location = "https://fybrrstream.herokuapp.com";
    }
  }