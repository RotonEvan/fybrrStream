var socketConnection;
var roomHash;
var graph;

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
        var adj_list = JSON.parse(signal.data);
        updateGraph(adj_list);
    }
}

const interval = setInterval(function ping() {
    socketConnection.send(JSON.stringify({'from' : 'admin', 'to' : 'server', 'context' : 'GRAPH', 'roomID' : roomHash}));
}, 3000);


function updateGraph(adj_list){
    graph = new Dracula.Graph();

    Object.keys(adj_list).forEach(function(peer_id) {
        adj_list[peer_id].forEach(other_peer_id => {
            graph.addEdge(peerd_id, other_peer_id);
        });
    });

    var layouter = new Dracula.Layout.Spring(graph);
    layouter.layout();

    var renderer = new Dracula.Renderer.Raphael('canvas', graph, 900, 900);
    renderer.draw();
}