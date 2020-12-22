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
        { 'urls': 'stun:stun.stunprotocol.org:3478' },
        // { 'urls': 'stun:stun.voiparound.com' },
        // { 'urls': 'stun:stun.voipbuster.com' },
        // { 'urls': 'stun:stun.voipstunt.com' },
        // { 'urls': 'stun:stun.voxgratia.org' }
    ]
};

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
    uuid = create_UUID();

    // calculate and set limit
    limit = prompt("Enter Limit: ");

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
        }
    };

    // setting up socket connection
    socketConnection = new WebSocket('wss://' + location.host);
    socketConnection.onmessage = messageHandler;
    socketConnection.onopen = event => {
        sendMessage(uuid, 'server', 'JOIN', JSON.stringify({'roomID' : roomHash, 'score' : score, 'limit' : limit}));
    }
}

function sendMessage (from, to, context, data) {
    socketConnection.send(JSON.stringify({'from' : from, 'to' : to, 'context' : context, 'data' : data}));
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
        // RTC Connection setup starts with CONNECT request - sender is Child, receiver is Parent
        sendMessage(uuid, peer, 'CONNECT', JSON.stringify({'roomID' : roomHash}));
    }
    else if (context == 'PARENT') {
        var data = JSON.parse(signal.data);
        var peer = data.peer;
        // RTC Connection setup starts with CONNECT request - sender is Child, receiver is Parent
        sendMessage(uuid, peer, 'CONNECT', JSON.stringify({'roomID' : roomHash}));
    }
    else if (context == 'CONNECT') {
        var peer = signal.from;
        setUpPeer(peer);
        // sending CONNECT_ACK response
        sendMessage(uuid, peer, 'CONNECT_ACK', JSON.stringify({'roomID' : roomHash}));
    }
    else if (context == 'CONNECT_ACK') {
        var peer = signal.from;
        setUpPeer(peer, true);
    }
    else if (context == 'SDP') {
        var data = JSON.parse(signal.data);
        var sdp = data.sdp;
        var peer = signal.from;
        peerConnections[peer].pc.setRemoteDescription(new RTCSessionDescription(sdp)).then(function () {
            if (sdp.type == 'offer') {
                peerConnections[peer].pc.createAnswer().then(description => createdDescription(description, peer)).catch(errorHandler);
            }
        });
    }
    else if (context == 'ICE') {
        var data = JSON.parse(signal.data);
        var ice = data.ice;
        console.log(ice);
        var peer = signal.from;
        peerConnections[peer].pc.addIceCandidate(new RTCIceCandidate(ice)).catch(errorHandler);
    }
}

function setUpPeer(peer, initCall = false) {
    peerConnections[peer] = { 'id': peer, 'pc': new RTCPeerConnection(peerConnectionConfig) };
    peerConnections[peer].pc.onicecandidate = event => gotIceCandidate(event, peer);
    peerConnections[peer].pc.ontrack = event => gotRemoteStream(event, peer);
    peerConnections[peer].pc.oniceconnectionstatechange = event => checkPeerDisconnect(event, peer);
    
    if (!(initCall)) {
        localStream.getTracks().forEach(t => {
            peerConnections[peer].pc.addTrack(t, localStream);
        });
        // peerConnections[peer].pc.addStream(localStream);
    }
  
    if (initCall) {
        console.log(`call inititated: ${uuid} to ${peer}`);
        peerConnections[peer].pc.createOffer({iceRestart: true}).then(description => createdDescription(description, peer)).catch(errorHandler);
    }
}
  
function gotIceCandidate(event, peer) {
    if (event.candidate != null) {
        sendMessage(uuid, peer, 'ICE', JSON.stringify({'ice' : event.candidate, 'roomID' : roomHash}));
    }
}
  
function createdDescription(description, peer) {
    console.log(`got description, peer ${peer}`);
    peerConnections[peer].pc.setLocalDescription(description).then(function () {
        sendMessage(uuid, peer, 'SDP', JSON.stringify({'sdp' : peerConnections[peer].pc.localDescription, 'roomID' : roomHash}));
    }).catch(errorHandler);
}
  
function gotRemoteStream(event, peer) {
    // var videle = document.getElementById('remoteVideo_'+peer);
    // if(videle==null)
    // {
    //     console.log(`got remote stream, peer ${peer}`);
    //     //assign stream to new HTML video element
    //     var vidElement = document.getElementById('localVideo');
    //     vidElement.setAttribute('autoplay', '');
    //     vidElement.setAttribute('muted', '');
    //     vidElement.srcObject = event.streams[0];

    //     localStream = event.streams[0];
    
    //     var vidContainer = document.createElement('div');
    //     vidContainer.setAttribute('id', 'remoteVideo_' + peer);
    //     vidContainer.setAttribute('class', 'videoContainer');
    //     vidContainer.appendChild(vidElement);
    //     vidContainer.appendChild(makeLabel(peerConnections[peer].displayName));
    //     vidContainer.appendChild(makeAudioLabel(peerConnections[peer].isMute));
    
    //     document.getElementById('videos').appendChild(vidContainer);
    
    //     updateLayout();
    // }
    var vidElement = document.getElementById('localVideo');
    vidElement.srcObject = event.streams[0];
    localStream = event.streams[0];
}
  
function checkPeerDisconnect(event, peer) {
    var state = peerConnections[peer].pc.iceConnectionState;
    console.log(`connection with peer ${peer} ${state}`);
    if (state === "failed" || state === "closed") {
        delete peerConnections[peer];
        document.getElementById('videos').removeChild(document.getElementById('remoteVideo_' + peer));
        updateLayout();
    }
}

function errorHandler(error) {
    console.log(error);
}