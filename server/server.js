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
  // console.log("request received : " + request);

  //TO-DO
  if (request.url === '/client.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end(fs.readFileSync('client/client.js'));
  } else if (request.url === '/font-awesome.min.css') {
    response.writeHead(200, { 'Content-Type': 'text/css' });
    response.end(fs.readFileSync('client/font-awesome.min.css'));
  } else if (request.url === '/style.css') {
    response.writeHead(200, { 'Content-Type': 'text/css' });
    response.end(fs.readFileSync('client/style.css'));
  } else if (request.url === '/css/style.css') {
    response.writeHead(200, { 'Content-Type': 'text/css' });
    response.end(fs.readFileSync('client/css/style.css'));
  } else if (request.url === '/css/bootstrap.min.css') {
    response.writeHead(200, { 'Content-Type': 'text/css' });
    response.end(fs.readFileSync('client/css/bootstrap.min.css'));
  } else if (request.url === '/css/animsition.min.css') {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(fs.readFileSync('client/css/animsition.min.css'));
  } else if (request.url === '/favicon/apple-touch-icon.png') {
    response.writeHead(200, { 'Content-Type': 'image/png' });
    response.end(fs.readFileSync('client/favicon/apple-touch-icon.png'));
  } else if (request.url === '/favicon/favicon-16x16.png') {
    response.writeHead(200, { 'Content-Type': 'image/png' });
    response.end(fs.readFileSync('client/favicon/favicon-16x16.png'));
  } else if (request.url === '/favicon/favicon-32x32.png') {
    response.writeHead(200, { 'Content-Type': 'image/png' });
    response.end(fs.readFileSync('client/favicon/favicon-32x32.png'));
  } else if (request.url === '/favicon/site.html') {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(fs.readFileSync('client/favicon/site.html'));
  } else if (request.url === '/fonts/butler_extrabold-webfont.eot') {
    response.writeHead(200, { 'Content-Type': 'font/eot' });
    response.end(fs.readFileSync('client/fonts/butler_extrabold-webfont.eot'));
  } else if (request.url === '/fonts/butler_extrabold-webfont.html') {
    response.writeHead(200, { 'Content-Type': 'font/html' });
    response.end(fs.readFileSync('client/fonts/butler_extrabold-webfont.html'));
  } else if (request.url === '/fonts/butler_extrabold-webfont.ttf') {
    response.writeHead(200, { 'Content-Type': 'font/ttf' });
    response.end(fs.readFileSync('client/fonts/butler_extrabold-webfont.ttf'));
  } else if (request.url === '/fonts/butler_extrabold-webfont.woff') {
    response.writeHead(200, { 'Content-Type': 'font/woff' });
    response.end(fs.readFileSync('client/fonts/butler_extrabold-webfont.woff'));
  } else if (request.url === '/fonts/butler_extrabold-webfont41d.eot') {
    response.writeHead(200, { 'Content-Type': 'font/eot' });
    response.end(fs.readFileSync('client/fonts/butler_extrabold-webfont41d.eot'));
  } else if (request.url === '/img/bg-body.png') {
    response.writeHead(200, { 'Content-Type': 'image/png' });
    response.end(fs.readFileSync('client/img/bg-body.png'));
  } else if (request.url === '/img/bg-promo.png') {
    response.writeHead(200, { 'Content-Type': 'image/png' });
    response.end(fs.readFileSync('client/img/bg-promo.png'));
  } else if (request.url === '/js/animation.gsap.min.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end(fs.readFileSync('client/js/animation.gsap.min.js'));
  } else if (request.url === '/js/animation.min.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end(fs.readFileSync('client/js/animation.min.js'));
  } else if (request.url === '/js/bootstrap.min.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end(fs.readFileSync('client/js/bootstrap.min.js'));
  } else if (request.url === '/js/jquery.min.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end(fs.readFileSync('client/js/jquery.min.js'));
  } else if (request.url === '/js/popper.min.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end(fs.readFileSync('client/js/popper.min.js'));
  } else if (request.url === '/js/script.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end(fs.readFileSync('client/js/script.js'));
  } else if (request.url === '/js/ScrollMagic.min.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end(fs.readFileSync('client/js/ScrollMagic.min.js'));
  } else if (request.url === '/js/smoothscroll.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end(fs.readFileSync('client/js/smoothscroll.js'));
  } else if (request.url === '/js/TweenMax.min.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' });
    response.end(fs.readFileSync('client/js/TweenMax.min.js'));
  } else if (request.url === '/room') {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(fs.readFileSync('client/room.html'));
  } else {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(fs.readFileSync('client/index.html'));
  }
}

// setting up server

const httpsServer = http.createServer(serverConfig, handleRequest);
httpsServer.listen(HTTPS_PORT);

//setting up socket server

const wss = new WebSocket.Server({server: httpsServer});

// server side logic begins

var rooms = {} // Room Object Array

wss.on("connection", function (ws) {
  //ws - websocket of one peer
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  ws.on('message', async function(message) {
    // console.log(message);
    var signal = JSON.parse(message);

    if (signal.to == 'server') {
      console.log(message);
    }
    
    // message syntax : 
    // msg = {'from' : peerID/'server'; 'to' : peerID/'server'; 'context' : contextType; 'data' : content};

    // var signal = JSON.parse(message);
    var peer_id = signal.from;

    //context - new peer joins

    if (signal.context == 'JOIN' && signal.to == 'server') {
      var data = JSON.parse(signal.data);
      console.log(data);

      // possible JSON data
      // 'roomID' : abc123;

      var room = data.roomID;
      var score = data.score;
      var limit = data.limit;
      var currRoom = rooms[room];

      // Check if room is already present( with source node) in the rooms.
      if (currRoom) {
        currRoom.addNode(peer_id, score, limit, ws);
        peerJoining(currRoom, peer_id, limit);
      }
      // this node is source node; room needs to be created
      else {
        console.log('source enters');
        var newRoom = new Room(room, peer_id);
        rooms[room] = newRoom;
        newRoom.addNode(peer_id, score, limit, ws);
        // console.log(newRoom);
        // inform node that it is source node
        sendMessage('server', peer_id, 'SOURCE', JSON.stringify({'room' : room}), newRoom);
      }
    }
    else if(signal.context == 'LEAVE' && signal.to == 'server') {

      var data = JSON.parse(signal.data);
      var room = data.roomID;
      var currRoom = rooms[room];
      peerLeaving(peer_id, currRoom);
      currRoom.removeNode(peer_id);
    }
    else if (signal.context == 'FAIL' && signal.to == 'server') {
      var data = JSON.parse(signal.data);
      var room = data.roomID;
      var currRoom = rooms[room];
      var node = data.node;
      console.log(`${node} failed`);
      peerLeaving(node, currRoom);
      currRoom.removeNode(node);
    }
    else if (signal.context == 'GETNODETIMESTAMPDATA' && signal.to == 'server'){
      var data = JSON.parse(signal.data);
      var room = data.roomID;
      var currRoom = rooms[room];
      // console.log('Source is requesting for node timestamp data');
      sendMessage('server', peer_id, 'NODETIMESTAMPDATA', JSON.stringify({'timestamp_data' : currRoom.getTimestampData()}), currRoom);
    }
    else if (signal.context == 'ADJLIST') {
      var data = JSON.parse(signal.data);
      var room = data.roomID;
      var currRoom = rooms[room];
      var newparent = data.newparent;
      var oldparent = data.oldparent;
      var adj_list = currRoom.getAdjListIDs(oldparent);
      // console.log(adj_list);
      for (let i = 0; i < adj_list.length; i++) {
        currRoom.delinkNodes(adj_list[i], oldparent);
        sendMessage('server', adj_list[i], 'PARENT', JSON.stringify({'peer' : newparent}), currRoom);
        currRoom.linkNodes(adj_list[i], newparent);
      }
    }
    else if(signal.to != 'server') {
      // message to be forwarded to a node
      // console.log(signal);
      receiver = signal.to;
      var data = JSON.parse(signal.data);
      // console.log(data);

      var room = data.roomID;
      if (rooms[room].getWS(receiver).readyState === WebSocket.OPEN) {
        rooms[room].getWS(receiver).send(JSON.stringify(signal));
      }
    }

  });
});

function peerJoining (currRoom, peer_id, limit) {
  console.log(`${peer_id} is willing to JOIN!`);
  // Check if source can serve some more direct children peers.
  if (currRoom.isNodeLimitNotReached()) {
    sendSourceStream(peer_id, currRoom);
  }
  // Otherwise execute the JOINING Protocol
  else {
    var [minNodeID, minNodeLimit] = currRoom.findMin();

    // Check if limit of new node is more than those peers which are directly connected to source
    if (limit > minNodeLimit) {
      replaceSourceStream(peer_id, minNodeID, currRoom);
    }
    else {
      var bestpeer = currRoom.getBestNodes();
      sendMessage('server', peer_id, 'PARENT', JSON.stringify({'peer' : bestpeer}), currRoom);
      currRoom.linkNodes(peer_id, bestpeer);
    }
  }
}

function peerLeaving (peer_id, room) {
  if (peer_id == room.getSourceID()){
    return;
  }

  if (!(room.isPresent(peer_id))) {
    return;
  }

  var parent_id = room.getParentID(peer_id);
  var best_child_id = room.getBestChild(peer_id);
  
  if (parent_id == room.getSourceID()){
    best_child_id = room.findNextBestNode();
    if (best_child_id != -1) {
      // sendSourceStream(best_child_id, room);
      sendMessage('server', best_child_id, 'DIRECTCHILDOFSOURCE', JSON.stringify({'parent' : room.getSourceID()}), room);
      // room.delinkNodes(peer_id);
      // room.delinkNodes(best_child_id, peer_id);
      room.linkNodes(best_child_id);
      var adj_list = room.getAdjListIDs(peer_id);
      room.removeNode(peer_id);
      for (let i = 0; i < adj_list.length; i++) {
        if (adj_list[i] != best_child_id) {
          // room.delinkNodes(adj_list[i], peer_id);
          peerJoining(room, adj_list[i], room.getLimitOfNode(adj_list[i]));
        }
      }
    }
  }
  else if (best_child_id != -1){
    replaceParentStream(parent_id, best_child_id, peer_id, room);
    var adj_list = room.getAdjListIDs(peer_id);
    room.removeNode(peer_id);
    for (let i = 0; i < adj_list.length; i++) {
      if (adj_list[i] != best_child_id) {
        // room.delinkNodes(adj_list[i], peer_id);
        peerJoining(room, adj_list[i]);
      }
    }
    // sendMessage('server', best_child_id, 'PARENT', JSON.stringify({'peer' : parent_id}));
    // room.delinkNodes(best_child_id, peer_id);
    // room.linkNodes(best_child_id, parent_id);
  }
}

function sendSourceStream(peer_id, currRoom) {
  // var src = room.getSourceID();
  // sendMessage('server', src, 'SEND', JSON.stringify({'peer' : peer}), room);
  sendMessage('server', peer_id, 'DIRECTCHILDOFSOURCE', JSON.stringify({'parent' : currRoom.getSourceID()}), currRoom);
  currRoom.linkNodes(peer_id);
}

function replaceSourceStream(peer_id, minNodeID, currRoom) {
  sendMessage('server', currRoom.getSourceID(), 'CHILDLEFT', JSON.stringify({'child' : minNodeID}), currRoom);
  sendMessage('server', peer_id, 'DIRECTCHILDOFSOURCEANDREPLACE', JSON.stringify({'parent' : currRoom.getSourceID(), 'child' : minNodeID}), currRoom);
  currRoom.linkNodes(peer_id);
  currRoom.delinkNodes(minNodeID);
  currRoom.linkNodes(minNodeID, peer_id);
  // var adj_list = currRoom.getAdjListIDs(minNodeID);
  // console.log(adj_list);
  // for (let i = 0; i < adj_list.length; i++) {
  //   currRoom.delinkNodes(adj_list[i], minNodeID);
  //   sendMessage('server', adj_list[i], 'PARENT', JSON.stringify({'peer' : peer_id}), currRoom);
  //   currRoom.linkNodes(adj_list[i], peer_id);
  // }
}

function sendMessage (from, to, context, data, room) {
  if (room.getWS(to).readyState === WebSocket.OPEN) {
    room.getWS(to).send(JSON.stringify({'from' : from, 'to' : to, 'context' : context, 'data' : data}));
  }
  // room.getWS(to).send(JSON.stringify({'from' : from, 'to' : to, 'context' : context, 'data' : data}));
}

function replaceParentStream(id, newPeer, oldPeer, currRoom){
  // sendMessage('server', id, 'REPLACE', JSON.stringify({'newPeer' : newPeer, 'oldPeer' : oldPeer}), room);
  sendMessage('server', id, 'CHILDLEFT', JSON.stringify({'child' : oldPeer}), currRoom);
  sendMessage('server', newPeer, 'PARENT', JSON.stringify({'peer' : id}), currRoom);
  currRoom.delinkNodes(newPeer, oldPeer);
  currRoom.linkNodes(newPeer, id);
}

function sendMessage (from, to, context, data, room) {
  if (room.getWS(to).readyState === WebSocket.OPEN) {
    room.getWS(to).send(JSON.stringify({'from' : from, 'to' : to, 'context' : context, 'data' : data}));
  }
  room.getWS(to).send(JSON.stringify({'from' : from, 'to' : to, 'context' : context, 'data' : data}));
}

console.log('Server running.');

// -----------------------------------------------------------------------------------------------------------------------------

// Separate server to redirect from http to https
http.createServer(function (req, res) {
  console.log(req.headers['host']+req.url);
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
}).listen(HTTP_PORT);

// setInterval(() => {
// wss.clients.forEach((client) => {
//   if (client.readyState === WebSocket.OPEN) {
//     client.send(JSON.stringify("1"));
//   }
// });
// }, 1000);

const dummy = [1,2,3];

function heartbeat() {
  this.isAlive = true;
}

const interval = setInterval(function ping() {
  Object.keys(rooms).forEach(function(room) {
    var currRoom = rooms[room];
    Object.keys(currRoom.node_data).forEach(function(peer_id) {
      var ws = currRoom.getWS(peer_id);
      if (ws.isAlive === false || ws.readyState !== WebSocket.OPEN){
        console.log(`${peer_id} - left`);
        try{
          if (peer_id != currRoom.getSourceID()) {
            sendMessage('server', currRoom.getParentID(peer_id), 'CHILDLEFT', JSON.stringify({'child' : peer_id}), currRoom);
          }
          var adj_list = currRoom.getAdjListIDs(peer_id);
          for (let i = 0; i < adj_list.length; i++) {
            sendMessage('server', adj_list[i], 'PARENTLEFT', JSON.stringify({'parent' : peer_id}), currRoom);
          }
        }
        catch(err){
          console.log(err);
        }
        finally{
          peerLeaving(peer_id, currRoom);
          currRoom.removeNode(peer_id);
          return ws.terminate();
        }
      } 
      ws.isAlive = false;
      ws.ping(dummy);
    });
  });
}, 3000);

wss.on('close', function close() {
  clearInterval(interval);
});
