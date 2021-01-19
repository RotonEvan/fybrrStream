const Node = require("./Node");

module.exports = class Room {
    constructor (room_id, source_id) {
        this.room_id = room_id;
        this.node_data = {};
        this.timestamp_data = {};
        this.graph_data = {};
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

    getLimitOfNode(node_id) {
        return this.node_data[node_id].getLimit();
    }

    isPresent(node_id) {
        if (this.node_data[node_id]) {
            return true;
        }
        else {
            return false;
        }
    }
    
    getTimestampData () {
        return this.timestamp_data;
    }

    getUpdatedGraph () {
        this.graph_data = {};
        var data = {}
        Object.assign(data, this.node_data);

        // Create items array
        var items = Object.keys(this.node_data).map(function(key) {
            return [key, data[key]];
        });

        for (let i = 0; i < items.length; i++) {
            const element = items[i];
            var id = element[1].getID();

            var list =  this.getAdjListIDs(id);
            this.graph_data[id] = list;
        }

        return this.graph_data;
    }

    addNode (id, score, limit, websocket) {
        this.node_data[id] = new Node(id, score, limit, websocket);
        ++this.size;
        this.timestamp_data[new Date().getTime()] = this.size;
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
        if (!(this.node_data[node])) {
            return;
        }
        if (node != this.getSourceID()){
            this.delinkNodes(node, this.getParentID(node));
        }
        this.node_data[node].getAdjList().forEach(i => {
            i.setParent(null);
        });
        // this.node_data[node].emptyAdjList();
        delete this.node_data[node];
        --this.size;
        this.timestamp_data[new Date().getTime()] = this.size;
    }

    isNodeLimitNotReached(nodeID = this.source_id) {
        return (this.node_data[nodeID].getSlots() > 0);
    }

    getBestNodes () {
        var best_node = this.source_id;
        var best_node_score = -1;

        var node_data = {};
        Object.assign(node_data, this.node_data);

        Object.keys(node_data).forEach(function(peer_id) {
            var node = node_data[peer_id];
            console.log([peer_id, node.getScore(),best_node, best_node_score]);
            if ((node.getScore() > best_node_score) && (node.getSlots() > 0) && (node.getParent())){
                best_node = peer_id;
                best_node_score = node.getScore();
            }
        });
        console.log(best_node);

        return best_node;
    }    

    findNextBestNode () {
        var max = -1;
        var maxNode = -1;

        var data = {};
        Object.assign(data, this.node_data);

        // Create items array
        var items = Object.keys(this.node_data).map(function(key) {
            return [key, data[key]];
        });

        for (let i = 0; i < items.length; i++) {
            const element = items[i];
            if(element[1].getID() == this.source_id || element[1].getParent().getID() == this.source_id)    continue;
            if (max < element[1].getScore()) {
                max = element[1].getScore();
                maxNode = element[1].getID();
            }
        }

        return maxNode;
    }
    
    getParentID(node){
        if (this.node_data[node].getParent())   return this.node_data[node].getParent().getID();
        else    return -1;
    }

    getBestChild(node){
        var maxChild = this.node_data[node].maxScoreChild();
        if (maxChild == -1) return -1;
        else    return maxChild.getID();
    }

    getAdjListIDs(node) {
        var list =  this.node_data[node].getAdjList();
        var new_list = [];
        for (let i = 0; i < list.length; i++) {
            new_list.push(list[i].getID());
        }
        return new_list;
    }
}