module.exports = class Room {
    constructor (room_id, node_data = null) {
        this.room_id = room_id;
        this.node_data = node_data;
    }
}