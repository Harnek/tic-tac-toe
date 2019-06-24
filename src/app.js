const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()
const server = require('http').createServer(app);
const io = require('socket.io')(server);


app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})


const boards = {}
const pieces = [0, 1]
let playerId = 1
const waitingRooms = []

const createBoard = () => {
    let board = []
    for (let i = 0; i < 3; i++) {
        board[i] = []
        for (let j = 0; j < 3; j++) {
            board[i][j] = null
        }
    }
    return board
}

const checkBoard = (board) => {
    // Check rows and cols
    for (let i = 0; i < 3; i++) {
        prevR = board[i][0]
        prevC = board[0][i]
        flagR = (prevR !== null) ? true: false
        flagC = (prevC !== null) ? true: false
        
        for (let j = 1; j < 3; j++) {
            if (board[i][j] !== prevR){
                flagR = false
            }
            if (board[j][i] !== prevC){
                flagC = false
            }
        }

        if (flagR || flagC) {
            return true
        }
    }

    //check top-down diagonal
    if (board[0][0] !== null){
        if (board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
            return true
        }
    }
    // check bottom-up diagonal
    if (board[2][0] !== null) {
        if (board[2][0] === board[1][1] && board[1][1] === board[0][2]) {
            return true
        }
    }

    return false
}

const fullBoard = (board) => {
    for (var i = 0; i < 3; i++){
        for (var j = 0; j < 3; j++){
            if (board[i][j] === null){
                return false
            }
        }
    }

    return true
}

const generateID = () => {
    return (Math.random().toString().substr(2, 5))
}

const leftWaitingRoom = (rid) => {
    for (var i = 0; i < waitingRooms.length; i++) {
        if (waitingRooms[i] === rid){
            waitingRooms.splice(i, 1)
            return true
        }
    }

    return false
}


io.on('connection', (socket) => {
    socket.on('newPlayer', (data, callback) => {
        console.log(`Player ${(playerId + 1) % 2 + 1} has joined`)

        let info = {
            roomId: null,
            playerId,
            piece: null,
            turn: false
        }

        if (waitingRooms.length > 0) {
            info.roomId = waitingRooms[0]
            info.piece = 0

            waitingRooms.splice(0, 1)
            socket.join(info.roomId)
        }else{
            info.roomId = generateID()
            info.piece = 1
            info.turn = true

            waitingRooms.push(info.roomId)
            boards[info.roomId] = createBoard();
            socket.join(info.roomId)
        }

        const members = io.sockets.adapter.rooms[info.roomId].length
        if (members === 2){
            socket.to(info.roomId).emit('playerJoined')
        }

        playerId++;
        callback(null, info)
    })

    socket.on('createRoom', (data, callback) => {
        const roomId = generateID()
        let info = {
            roomId,
            playerId,
            piece: 1,
            turn: true
        }
        boards[roomId] = createBoard()
        waitingRooms.push(roomId)
        playerId++;
        socket.join(roomId)
        callback(null, info)
    })

    socket.on('joinRoom', (data, callback) => {
        let members = 0
        const room = io.sockets.adapter.rooms[data.roomId]
        if (room != undefined) {
            members = room.length
        }
        if (members === 0) {
            return callback('Invalid Id')
        }
        if (members === 2) {
            return callback('Game Full')
        }

        
        let info = {
            roomId: data.roomId,
            playerId,
            piece: 0,
            turn: false
        }

        playerId++;
        leftWaitingRoom(data.roomId)

        socket.join(data.roomId)
        socket.to(data.roomId).emit('playerJoined')

        callback(null, info)
    })

    socket.on('update', (data, callback) => {
        const i = data.x, j = data.y;
        let members = 0
        const room = io.sockets.adapter.rooms[data.roomId]
        if (room != undefined) {
            members = room.length
        }

        if (members < 2){
            callback('Second player has not joined')
        }
        else if (boards[data.roomId][i][j] === null){
            boards[data.roomId][i][j] = data.piece
            
            let status = {
                draw: false, 
                piece: data.piece
            }
            if (checkBoard(boards[data.roomId])){
                io.to(data.roomId).emit('status', status)
            }
            else if (fullBoard(boards[data.roomId])) {
                status.draw = true
                io.to(data.roomId).emit('status', status)
            }
            else{
                socket.to(data.roomId).emit('updates', data)
            }
            callback(null)
        } else {
            callback('Something Went Wrong')
        }
    })

    socket.on('disconnecting', () => {
        console.log('Player left')
        for (roomIDs in socket.rooms){
            if (roomIDs.length === 5){
                if (leftWaitingRoom(roomIDs) === false){
                    socket.to(roomIDs).emit('playerLeft')
                }
                break
            }
        }
    })
})

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server started at port ${port}`))