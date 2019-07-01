const Board = require('./board')
const { boards, waitingRooms } = require('../config/config')
const { generateRoomID, generatePlayerID, leaveWaitingRoom, clientsConnected } = require('./utils')

module.exports = function(server){

    var io = require("socket.io")(server);
    
    io.on('connection', function(socket) {
        socket.on('new game', (data, callback) => {
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
                io.in(status.roomID).emit('join game')
            }
        
            console.log(`Player joined room: ${status.roomID}`)
        })
    
        socket.on('new room', (data, callback) => {
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
    
        socket.on('join room', (data, callback) => {
            let clients = clientsConnected(io, data.roomID)
            if (clients === 0) {
                return callback('Invalid Room')
            }
            if (clients === 2) {
                return callback('Room Full')
            }

            let status = {
                playerID: generatePlayerID(),
                piece: 0,
                turn: false
            }
    
            leaveWaitingRoom(data.roomID)
            socket.join(data.roomID)
            socket.roomID = data.roomID
            socket.username = data.username

            callback(null, status)

            io.in(socket.roomID).emit('join game')
        })
        
        socket.on('username', () => {
            socket.to(socket.roomID).emit('username', socket.username)
        })

        socket.on('move', (data) => {
            let status = {
                error: null,
                piece: data.piece,
                state: null,
                x: data.x,
                y: data.y
            }
    
            const clients = clientsConnected(io, socket.roomID)

            if ( boards[socket.roomID].update(data.x, data.y, data.piece) ) {
                status.state = boards[socket.roomID].getState()
            }
            else {
                status.error = 'Invalid Move'
            }
    
            io.to(socket.roomID).emit('update', status)
        })
    
        socket.on('rematch', () => {
            boards[socket.roomID].reset()
        })

        socket.on('leave game', () => {
            socket.to(socket.roomID).emit('leave game')
            socket.leave(socket.roomID)
            delete boards[socket.roomID]
            socket.roomID = null
        })

        socket.on('disconnect', () => {
            leaveWaitingRoom(socket.roomID)
            socket.to(socket.roomID).emit('leave game')
            delete boards[socket.roomID]
            console.log(`Player left room: ${socket.roomID}`)
            socket.roomID = null
        })
    });

    return io;
};