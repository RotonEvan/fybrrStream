const Room = require('./Objects/Room')

const HTTPS_PORT = process.env.PORT || 8443; //default port for https is 443
const HTTP_PORT = 8001; //default port for http is 80

const fs = require('fs');
const http = require('http');
const https = require('https');
// based on examples at https://www.npmjs.com/package/ws
const WebSocket = require('ws');
const { sign } = require('crypto');

// Yes, TLS is required
const serverConfig = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

const handleRequest = function(request, response) {
    console.log("request received : " + request);

    //TO-DO
}

// setting up server

const httpsServer = https.createServer(serverConfig, handleRequest);
httpsServer.listen(HTTPS_PORT);

//setting up socket server

const wss = new WebSocket.Server({server: httpsServer});

// server side logic begins

var rooms = {} // Room Object Array

wss.on("connection", function (ws) {
  //ws - websocket of one peer

  ws.on('message', function(message) {
    console.log(message);
    var signal = JSON.parse(message);
    
    // message syntax : 
    // 'from' : peerID/server; 'to' : peerID/server; 'context' : contextType; 'data' : content;

    var peer_id = signal.from;

    //context - new peer joins

    if (signal.context == 'JOIN') {
      var data = JSON.parse(signal.data);
      console.log(data);

      // possible JSON data
      // 'roomID' : abc123;

      var room = data.roomID;
      var score = data.score;
      var limit = data.limit;
      if (currRoom = rooms[room]) {
        // room already present with source node in the room
        if (currRoom.isNodeLimitNotReached()) {
          var currNode = currRoom.addNode(peer_id, score, limit, ws);
          sendSourceStream(peer_id, currRoom);
          currRoom.linkNodes(currNode);
        }
        else {
          // source limit reached; peer joining protocol begins
          var currNode = currRoom.addNode(peer_id, score, limit, ws);

          // check if node limit is more than those directly connected to source
          var [minNodeID, minNodeLimit] = currRoom.findMin();

          if (limit > minNodeLimit) {
            // replace

            replaceSourceStream(peer_id, minNodeID, currRoom);
            linkNodes(minNodeID, peer_id);
          }
          else {
            // send best peers list
            sendMessage('server', peer_id, 'BESTPEERLIST', JSON.stringify({'list' : currRoom.getBestNodes()}));
          }
        }
      }
      else {
        // this node is source node; room needs to be created
        var newRoom = new Room(room, peer_id);
        rooms[room] = newRoom;
        newRoom.addNode(peer_id, score, limit, ws);
      }
    }
    else if(signal.context == 'LEAVE') {

      var data = JSON.parse(signal.data);
      var room = data.roomID;

      peerLeaving(peer_id, rooms[room]);
    }

  });
});

function peerLeaving (peer_id, room) {
  var parent_id = room.getParentID(peer_id);
      var best_child_id = room.getBestChild(peer_id);
      
      if (best_child_id != -1){
        replaceParentStream(parent_id, peer_id, best_child_id);
      }
      else if (parent_id == room.getSourceID()){
          best_child_id = room.findNextBestNode();
          if (best_child_id != -1) {
            sendSourceStream(best_child_id, room);
          }
      }
}

function sendSourceStream(peer, room) {
  var src = room.getSourceID();
  sendMessage('server', src, 'SEND', JSON.stringify({'peer' : peer}), room);
}

function replaceSourceStream(newPeer, oldPeer, room) {
  var src = room.getSourceID();
  sendMessage('server', src, 'REPLACE', JSON.stringify({'newPeer' : newPeer, 'oldPeer' : oldPeer}), room);
  sendMessage('server', newPeer, 'SEND', JSON.stringify({'peer' : oldPeer}), room);
}

function sendMessage (from, to, context, data, room) {
  room.getWebsocket(to).send(JSON.stringify({'from' : from, 'to' : to, 'context' : context, 'data' : data}));
}

function replaceParentStream(id, newPeer, oldPeer, room){
  sendMessage('server', id, 'REPLACE', JSON.stringify({'newPeer' : newPeer, 'oldPeer' : oldPeer}), room);
}