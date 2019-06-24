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


let boards = []
let pieces = [0, 1]
let roomId = 0
let playerId = 1

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

io.on('connection', (socket) => {
    socket.on('newPlayer', (data, callback) => {
        console.log(`Player ${(playerId + 1) % 2 + 1} has joined`)
        socket.join(String(roomId))

        let info = {
            roomId,
            playerId,
            piece: pieces[playerId % 2],
        }
        if (playerId % 2 === 1) {
            boards[roomId] = createBoard()
        }else{
            roomId++;
        }
        playerId++;
        callback(null, info)
    })

    socket.on('update', (data, callback) => {
        const i = data.x, j = data.y;
        
        if (data.playerId === playerId - 1 && data.playerId % 2 === 1){
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
})

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server started at port ${port}`))