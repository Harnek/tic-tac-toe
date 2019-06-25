const { waitingRooms } = require('../config/config')

let playerID = 1

module.exports.generateRoomID = () => {    
    return (Math.random().toString().substr(2, 5))
}

module.exports.generatePlayerID = () => {
    return playerID++;
}

module.exports.leftWaitingRoom = (roomID) => {
    for (var i = 0; i < waitingRooms.length; i++) {
        if (waitingRooms[i] === roomID){
            return waitingRooms.splice(i, 1)[0]
        }
    }
    return null
}

module.exports.clientsConnected = (roomID) => {
    const clients = io.sockets.adapter.rooms[roomID]
    return (clients === undefined)? 0: clients.length
}