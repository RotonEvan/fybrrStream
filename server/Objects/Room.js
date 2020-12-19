const Node = require("./Node");

module.exports = class Room {
    constructor (room_id, source_id) {
        this.room_id = room_id;
        this.node_data = {};
        this.size = 1;
        this.source_id = source_id;
    }

    getRoomID () {
        return this.room_id;
    }

    getSourceID() {
        return this.source_id;
    }

    getSize () {
        return this.size;
    }

    getWS(node_id) {
        return this.node_data[node_id].getWebsocket();
    }
    
    addNode (id, score, limit, websocket) {
        this.node_data[id] = new Node(id, score, limit, websocket);
        this.size++;

        return this.node_data[id];
    }

    findMin () {
        var minNode = this.node_data[this.source_id].minLimitChild();
        return [minNode.getID(), minNode.getLimit()];
    }

    linkNodes(child, parent = this.source_id) {
        //link nodes
        this.node_data[parent].appendChild(this.node_data[child]);
        this.node_data[child].setParent(this.node_data[parent]);
    }

    isNodeLimitNotReached(nodeID = this.source_id) {
        return (this.node_data[nodeID].getSlots() > 0);
    }

    getBestNodes (size = this.getSize()) {
        var n = Math.log(size);
        var best_nodes = [];

        this.node_data.sort(function(x, y) {
            if (x.getScore() < y.getScore()) {
              return -1;
            }
            if (x.getScore() > y.getScore()) {
              return 1;
            }
            return 0;
          });
        
        this.node_data.forEach(i => {
            if (i.getSlots() > 0){
                var node_dic = {'id' : i.getID(), 'score' : i.getScore(), 'slots' : i.getSlots()};
                best_nodes.push(node_dic);
                if (best_nodes.length == n){
                    break;
                }
            }    
        });

        return best_nodes;
    }
    

}