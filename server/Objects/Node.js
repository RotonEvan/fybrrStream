module.exports = class Node {
    constructor (node_id, score, limit, adj_list = [], parent = null) {
        this.node_id = node_id;
        this.score = score;
        this.limit = limit;
        this.slots = limit;
        this.adj_list = adj_list;
        this.parent = parent;
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

    // setters and functions

    decreaseSlots () {
        --this.slots;
    }

    appendChild (node) {
        this.adj_list.push(node);
    }

    minScoreChild () {
        minimum = this.adj_list[0];
        min_limit = node_data[adjacency_matrix[0][0]].limit;
        for (i in adjacency_matrix[0]){
            if (node_data[adjacency_matrix[0][i]].limit < min_limit) {
                min_limit = node_data[adjacency_matrix[0][i]].limit;
                minimum = adjacency_matrix[0][i];
            }    
        }
        return minimum; 
    }

    setParent (node) {
        this.parent = node;
    }
}