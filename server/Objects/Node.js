module.exports = class Node {
    constructor (node_id, score, limit, websocket) {
        this.node_id = node_id;
        this.score = score;
        this.limit = limit;
        this.slots = limit;
        this.adj_list = [];
        this.parent = null;
        this.websocket = websocket;
    }

    //getters

    getID () {
        return this.node_id;
    }

    getScore () {
        return this.score;
    }

    getLimit () {
        return this.limit;
    }

    getSlots () {
        return this.slots;
    }

    getAdjList () {
        return this.adj_list;
    }

    getParent () {
        return this.parent;
    }

    getWebsocket(){
        return this.websocket;
    }

    // setters and functions

    decreaseSlots () {
        --this.slots;
    }

    increaseSlots () {
        ++this.slots;
    }

    appendChild (node) {
        this.adj_list.push(node);
        this.decreaseSlots();
    }

    removeChild(node) {
        this.adj_list.splice(this.adj_list.indexOf(node), 1);
        this.increaseSlots();
    }

    minLimitChild () {
        var minimum = this.adj_list[0];
        var min_limit = minimum.getLimit();
        
        this.adj_list.forEach(i => {
            if (i.getLimit() < min_limit) {
                min_limit = i.getLimit();
                minimum = i;
            }    
        });
        return minimum; 
    }

    maxScoreChild () {
        if (this.adj_list.length == 0){
            return -1;
        }
        var maximum = this.adj_list[0];
        var max_score = maximum.getScore();
        
        this.adj_list.forEach(i => {
            if (i.getScore() > max_score) {
                max_score = i.getScore();
                maximum = i;
            }    
        });
        return maximum;
    }

    setParent (node) {
        this.parent = node;

        console.log(`${node} parent of ${this.node_id}`);
    }

    emptyAdjlist () {
        this.adj_list = [];
    }
}