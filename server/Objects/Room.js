const Node = require("./Node");

module.exports = class Room {
    constructor (room_id, source_id) {
        this.room_id = room_id;
        this.node_data = {};
        this.size = 0;
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

        // return this.node_data[id];
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

    delinkNodes(child, parent = this.source_id) {
        // removing parent from child
        this.node_data[child].setParent(null);
        // removing child from parent
        this.node_data[parent].removeChild(this.node_data[child]);        
    }

    removeNode(node) {
        this.delinkNodes(node, this.getParentID(node));
        this.node_data[node].getAdjList().forEach(i => {
            i.setParent(null);
        });
        this.node_data[node].emptyAdjList();
        delete this.node_data[node];
    }

    isNodeLimitNotReached(nodeID = this.source_id) {
        return (this.node_data[nodeID].getSlots() > 0);
    }

    getBestNodes (size = this.getSize()) {
        var n = Math.ceil(Math.log2(size))
        console.log(n);
        var best_node;

        var data = this.node_data;

        // Create items array
        var items = Object.keys(this.node_data).map(function(key) {
            return [key, data[key]];
        });

        items.sort(function(x, y) {
            if (x[1].getScore() > y[1].getScore()) {
              return -1;
            }
            if (x[1].getScore() < y[1].getScore()) {
              return 1;
            }
            return 0;
        });

        console.log(items);

        for (let i = 0; i < items.length; i++) {
            const element = items[i];
            if (element[1].getSlots() > 0) {
                best_node = element[1].getID();
                break;
            }
        }
        
        // items.every(j => {
        //     var i = j[1];
        //     console.log(i.getSlots());
        //     if (i.getSlots() > 0){
        //         var node_dic = {'id' : i.getID(), 'score' : i.getScore(), 'slots' : i.getSlots()};
        //         best_nodes.push(node_dic);
        //         if (best_nodes.length == n){
        //             return false;
        //         }
        //     }    
        // });

        console.log(best_node);

        return best_node;
    }    

    findNextBestNode () {
        var max = -1;
        var maxNode = -1;
        this.node_data.forEach(i => {
            if (i.getParent().getID() == this.source_id)  continue;
            if (max < i.getScore()) {
                max = i.getScore();
                maxNode = i.getID();
            }
        });

        return maxNode;
    }
    
    getParentID(node){
        return this.node_data[node].getParent().getID();
    }

    getBestChild(node){
        return this.node_data[node].maxScoreChild()
    }
}