const Node = require("./Node");

module.exports = class Room {
    constructor (room_id) {
        this.room_id = room_id;
        this.node_data = {};
        this.size = 1;
    }

    getRoomID () {
        return this.room_id;
    }

    getSize () {
        return this.size;
    }
    
    addNode (id, score, limit, websocket) {
        this.node_data[id] = new Node(id, score, limit, websocket);
        this.size++;
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