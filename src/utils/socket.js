const Board = require('./board')
const { generateRoomID, generatePlayerID, leftWaitingRoom, clientsConnected } = require('./utils')

module.exports = function(server){

    var io = require("socket.io")(server);

    const boards = {}
    const waitingRooms = []
    
    // TODO: can this be relocated??
    function clientsConnected(roomID) {
        const clients = io.sockets.adapter.rooms[roomID]
        return (clients === undefined)? 0: clients.length
    }

    io.on('connection', function(socket) {
        socket.on('NEW_GAME', (data, callback) => {
            let status = {
                roomID: null,
                playerID: generatePlayerID(),
                state: 0,
                piece: null,
                turn: false
            }
    
            if (waitingRooms.length > 0) {
                status.roomID = waitingRooms.splice(0, 1)[0]
                status.piece = 0
            }else{
                status.roomID = generateRoomID()
                status.piece = 1
                status.turn = true
    
                waitingRooms.push(status.roomID)
                boards[status.roomID] = new Board;
            }
            socket.join(status.roomID)
    
            const clients = clientsConnected(status.roomID)
            if (clients === 2){
                socket.to(status.roomID).emit('PLAYER_JOINED')
            }
    
            callback(null, status)
        
            console.log(`Player joined room: ${status.roomID}`)
        })
    
        socket.on('CREATE_ROOM', (data, callback) => {
            const roomID = generateRoomID()
            let status = {
                roomID,
                playerID: generatePlayerID(),
                piece: 1,
                turn: true,
                status: null
            }
            boards[roomID] = new Board()
            waitingRooms.push(roomID)
            socket.join(roomID)
            callback(null, status)
        })
    
        socket.on('JOIN_ROOM', (data, callback) => {
            let clients = clientsConnected(data.roomID)
            if (clients === 0) {
                return callback('Invalid Game')
            }
            if (clients === 2) {
                return callback('Game Full')
            }
            
            let status = {
                roomID: data.roomID,
                playerID: generatePlayerID(),
                piece: 0,
                turn: false
            }
    
            leftWaitingRoom(data.roomID)
    
            socket.join(data.roomID)
            socket.to(data.roomID).emit('PLAYER_JOINED')
    
            callback(null, status)
        })
    
        socket.on('UPDATE', (data, callback) => {
            let status = {
                error: null,
                piece: data.piece,
                state: null,
                x: data.x,
                y: data.y
            }
    
            const clients = clientsConnected(data.roomID)
    
            if (clients === 0) {
                status.error = 'Invalid Game. Please Restart'
            }
            else if (clients < 2) {
                status.error = 'Second player has not joined'
            }
            else if ( boards[data.roomID].update(data.x, data.y, data.piece) ) {
                status.state = boards[data.roomID].getState()
            }
            else {
                status.error = 'Invalid Move'
            }
    
            io.to(data.roomID).emit('UPDATED', status)
        })
    
        socket.on('disconnecting', () => {
            for (roomID in socket.rooms){
                if (roomID.length === 5){
                    leftWaitingRoom(roomID)
                    socket.to(roomID).emit('PLAYER_LEFT')
                    
                    console.log(`Player left room: ${roomID}`)
                }
            }
        })
    });

    return io;
};