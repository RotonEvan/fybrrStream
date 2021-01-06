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
            "url": "turn:global.turn.twilio.com:3478?transport=udp",
            "username": "5c152fb5d3d8d9204560125570e46269beff48a4ca86ded9a826eeda4d9d2a89",
            "urls": "turn:global.turn.twilio.com:3478?transport=udp",
            "credential": "fC21hAbwL7EpXQJp1UFDQyOuVEWVOgdoST4oIgDBj90="
          },
          {
            "url": "turn:global.turn.twilio.com:3478?transport=tcp",
            "username": "5c152fb5d3d8d9204560125570e46269beff48a4ca86ded9a826eeda4d9d2a89",
            "urls": "turn:global.turn.twilio.com:3478?transport=tcp",
            "credential": "fC21hAbwL7EpXQJp1UFDQyOuVEWVOgdoST4oIgDBj90="
          },
          {
            "url": "turn:global.turn.twilio.com:443?transport=tcp",
            "username": "5c152fb5d3d8d9204560125570e46269beff48a4ca86ded9a826eeda4d9d2a89",
            "urls": "turn:global.turn.twilio.com:443?transport=tcp",
            "credential": "fC21hAbwL7EpXQJp1UFDQyOuVEWVOgdoST4oIgDBj90="
          },
        { 'urls': 'stun:stun.stunprotocol.org:3478' }
        // { 'urls': 'stun:stun.voiparound.com' },
        // { 'urls': 'stun:stun.voipbuster.com' },
        // { 'urls': 'stun:stun.voipstunt.com' },
        // { 'urls': 'stun:stun.voxgratia.org' }
    ]
};

var peerLogFileData = {};    // key : uuid, value : timestamped log object
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
    uuid = displayName + create_UUID();

    // calculate and set limit
    limit = prompt("Enter Limit: ");
    slots = limit;

    // calculate and set score
    score = prompt("Enter Score: ");

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


    peerLogFileData[uuid] = [{'joining_timestamp':new Date().getTime(), 'available_slots' : slots}];
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

    if (context == 'SOURCE') {
        isSource = true;

        if (navigator.mediaDevices.getUserMedia) {
            console.log("local video");
            navigator.mediaDevices.getUserMedia(constraints)
              .then(stream => {
                console.log("local stream");
                localStream = stream;
                localStream.getAudioTracks()[0].enabled = false;
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
        setInterval(() => {
            // Wait till localStream is set
            while (!(localStream)) {}
        });
        if (!(peer in peerConnections)){
            --slots;
            peerLogFileData[uuid].push({'timestamp':new Date().getTime(),'Type':'child_added', 'available_slots' : slots, 'child_id':peer});
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
        peerConnections[c].pc.close();
        delete peerConnections[c];
        ++slots;
        peerLogFileData[uuid].push({'timestamp':new Date().getTime(),'Type':'child_left', 'available_slots' : slots, 'child_id':c});
    }
    else if (context == 'PARENTLEFT') {
        var data = JSON.parse(signal.data);
        var p = data.parent;
        peerConnections[p].pc.close();
        delete peerConnections[p];
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
    var dt;
    // dt = new Date().getTime();
    for (const uuid in peerConnections) {
      if (Object.hasOwnProperty.call(peerConnections, uuid)) {
        const element = peerConnections[uuid];
        if (!(peerLogFileData[uuid])) {
          peerLogFileData[uuid] = [];
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
            peerLogFileData[uuid].push(relevant_data);
          }
        })
      }
    }
  }
}, 5000);
  
function gotRemoteStream(event, peer) {
    var vidElement = document.getElementById('localVideo');
    vidElement.srcObject = event.streams[0];
    localStream = event.streams[0];
    // if (parentConnection){
    //     delete peerConnections[parentConnection];
    // }
    // parentConnection = peer;
    
    if (logFlag == false) {
        var media_timestamp = new Date().getTime();
        peerLogFileData[uuid].push({'media_timestamp':media_timestamp});
        logFlag = true;
    }
}
  
function checkPeerDisconnect(event, peer) {
    var state = peerConnections[peer].pc.iceConnectionState;
    console.log(`connection with peer ${peer} ${state}`);
    if (state === "failed" || state === "closed") {
        sendMessage(uuid, 'server', "FAIL", JSON.stringify({'roomID' : roomHash, 'node' : peer}));
        delete peerConnections[peer];
        // document.getElementById('videos').removeChild(document.getElementById('remoteVideo_' + peer));
        // updateLayout();
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
    if (isSource){
        sendMessage(uuid, 'server', "GETNODETIMESTAMPDATA", JSON.stringify({'roomID' : roomHash}));
    }
    for (const uuid in peerLogFileData) {
      if (Object.hasOwnProperty.call(peerLogFileData, uuid)) {
        const element = peerLogFileData[uuid];
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(element));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", "Peer-" + uuid + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    }
  }
