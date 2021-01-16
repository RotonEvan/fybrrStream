// var crypto = require('crypto');

var socketConnection;
var roomHash;
var graph;
var prev_hash = "xyz";
var curr_hash;

var height = 900;
var width = 900;

function init(){

    roomHash = prompt("Enter Room ID: ");

    socketConnection = new WebSocket('wss://' + location.host);
    socketConnection.onmessage = messageHandler;
    
    // socketConnection.on('close', function close() {
    //     clearInterval(interval);
    // });
}

function messageHandler(message) {
    var signal = JSON.parse(message.data);
    var context = signal.context;

    if (context == 'UPDATEDGRAPH' && signal.to == 'admin'){
        var adj_list = signal.data;
        
        curr_hash = sha1(adj_list);

        if (prev_hash != curr_hash){
            prev_hash = curr_hash;
            updateGraph(adj_list);
        }
    }
}

const interval = setInterval(function ping() {
    socketConnection.send(JSON.stringify({'from' : 'admin', 'to' : 'server', 'context' : 'GRAPH', 'data' : JSON.stringify({'roomID' : roomHash})}));
}, 3000);

function sha1(input){
    return CryptoJS.SHA1(JSON.stringify(input)).toString();
}

function updateGraph(adj_list){
    document.getElementById('canvas').innerHTML = "";
    graph = new Graph();

    Object.keys(adj_list).forEach(function(peer_id) {
        adj_list[peer_id].forEach(other_peer_id => {
            graph.addEdge(peer_id.split('_')[0], other_peer_id.split('_')[0], {directed : true});
        });
    });

    var layouter = new Graph.Layout.Spring(graph);
    layouter.layout();

    var renderer = new Graph.Renderer.Raphael('canvas', graph, width, height);
    renderer.draw();
}