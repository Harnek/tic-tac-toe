const Board = require('./board')
const { boards, waitingRooms } = require('../config/config')
const { generateRoomID, generatePlayerID, leftWaitingRoom, clientsConnected } = require('./utils')

module.exports = function(server){

    var io = require("socket.io")(server);
    
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
            socket.roomID = status.roomID
            socket.username = data.username
            
            const clients = clientsConnected(io, socket.roomID)
            callback(null, status)

            if (clients === 2){
                io.in(status.roomID).emit('PLAYER_JOINED')
            }
        
            console.log(`Player joined room: ${status.roomID}`)
        })
    
        socket.on('NEW_ROOM', (data, callback) => {
            let roomID = generateRoomID()
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
            socket.roomID = roomID
            socket.username = data.username
            callback(null, status)
        })
    
        socket.on('JOIN_ROOM', (data, callback) => {
            let clients = clientsConnected(io, data.roomID)
            if (clients === 0) {
                return callback('Invalid Game')
            }
            if (clients === 2) {
                return callback('Game Full')
            }

            let status = {
                playerID: generatePlayerID(),
                piece: 0,
                turn: false
            }
    
            leftWaitingRoom(data.roomID)
            socket.join(data.roomID)
            socket.roomID = data.roomID
            socket.username = data.username

            callback(null, status)

            io.in(socket.roomID).emit('PLAYER_JOINED')
        })
        
        socket.on('GET_USERNAME', () => {
            socket.to(socket.roomID).emit('SET_USERNAME', socket.username)
        })

        socket.on('UPDATE', (data) => {
            let status = {
                error: null,
                piece: data.piece,
                state: null,
                x: data.x,
                y: data.y
            }
    
            const clients = clientsConnected(io, socket.roomID)

            if (clients === 0) {
                status.error = 'Invalid Game. Please Restart'
            }
            else if (clients < 2) {
                status.error = 'Second player has not joined'
            }
            else if ( boards[socket.roomID].update(data.x, data.y, data.piece) ) {
                status.state = boards[socket.roomID].getState()
            }
            else {
                status.error = 'Invalid Move'
            }
    
            io.to(socket.roomID).emit('UPDATED', status)
        })
    
        socket.on('REMATCH', () => {
            boards[socket.roomID].reset()
        })

        socket.on('LEAVE_ROOM', () => {
            socket.to(socket.roomID).emit('PLAYER_LEFT')
            socket.leave(socket.roomID)
            delete boards[socket.roomID]
            socket.roomID = null
        })

        socket.on('disconnect', () => {
            leftWaitingRoom(socket.roomID)
            socket.to(socket.roomID).emit('PLAYER_LEFT')
            delete boards[socket.roomID]
            console.log(`Player left room: ${socket.roomID}`)
            socket.roomID = null
        })
    });

    return io;
};