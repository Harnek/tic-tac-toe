const socket = io();
const board = document.getElementById('board')
const menu = document.getElementById('menu')
const status = document.getElementById('status')
const roomDisplay = document.getElementById('roomDisplay')
const newGameBt = document.getElementById('newGameBt')
const createRoomBt = document.getElementById('createRoomBt')
const joinRoomBt = document.getElementById('joinRoomBt')
const errorMsg = document.getElementById('error')
let piece = null
let turn = false
let roomId = null
let playerId = null
let updating = false

const displayError = (error) => {
    errorMsg.innerHTML = error
    errorMsg.style.visibility = 'visible'
    setTimeout(() => {
        errorMsg.style.visibility = 'hidden'
    }, 7000)
}

const drawUI = () => {
    // Attach on event listener
    for (var i = 0; i < board.rows.length; i++) {
        for (var j = 0; j < board.rows[i].cells.length; j++) {
            board.rows[i].cells[j].innerHTML = '<div></div>'
            board.rows[i].cells[j].onclick = function (pos) {
                move(pos);
            }
        }
    }
    board.style.display = 'block';
}

const updateUI = (node, p) => {
    if (p === 0){
        node.className = 'circle'
    }
    else {
        node.className = 'cross'
        node.innerHTML = '&#215'
    }
}

function move(pos) {
    if (updating === true || turn === false){
        return displayError('Wait for your opponent\'s turn')
    }
    updating = true

    const data = {
        roomId,
        playerId,
        piece,
        x: pos.target.parentNode.rowIndex,
        y: pos.target.cellIndex
    }

    console.log(data)

    socket.emit('update', data, (error) => {
        if (error) {
            displayError(error)
        }
        else {
            updateUI(pos.target.firstChild, piece)
            pos.target.onclick = null
            turn = false
        }
    });

    updating = false
}

const newGame = () => {
    //Send Get Piece Event
    socket.emit('newPlayer', null, (error, data) => {
        if (error) {
            alert(error)
        }
        else{
            roomId = data.roomId
            playerId = data.playerId
            piece = data.piece
            turn = data.turn

            menu.style.display = 'none';
            errorMsg.style.visibility = 'none'
            status.style.display = 'none'
            
            drawUI()   
        }
    })
    console.log(turn)
}

const createRoom = () => {
    socket.emit('createRoom', null, (error, data) => {
        if (error) {
            displayError(error)
        }else{
            roomId = data.roomId
            playerId = data.playerId
            piece = data.piece
            turn = data.turn

            menu.style.display = 'none';
            errorMsg.style.visibility = 'none'
            status.style.display = 'none'

            drawUI()

            roomDisplay.innerHTML = 'Room ID: ' + roomId
            roomDisplay.style.display = 'block'
        }
    })
}

const joinRoom = () => {
    let input = prompt("Enter Room Id: ", "")
    const info = {
        roomId: input
    }

    socket.emit('joinRoom', info, (error, data) => {
        if (error) {
            displayError(error)
        }else{
            roomId = data.roomId
            playerId = data.playerId
            piece = data.piece
            turn = data.turn

            menu.style.display = 'none';
            errorMsg.style.visibility = 'none'
            status.style.display = 'none'

            drawUI()

            if (piece === 1) {
                roomDisplay.innerHTML = 'Room ID: ' + roomId
                roomDisplay.style.display = 'block'
            }
        }
    })
}

socket.on('playerJoined', () => {

})

socket.on('playerLeft', () => {
    errorMsg.style.visibility = 'none'
    displayError('Your Opponent has left')
    setTimeout(() => {
        board.style.display = 'none'
        menu.style.display = 'block'
    }, 2000)
})

//Listen for moves
socket.on('updates', (data) => {
    errorMsg.style.visibility = 'hidden'

    let pos = board.rows[data.x].cells[data.y]
    updateUI(pos.firstChild, data.piece)
    pos.onclick = false
    turn = true
})

socket.on('status', data => {
    let msg = 'Game Draw'

    if (data.draw === false){
        msg = (data.piece === piece) ? 'You Won': 'You Lose' 
    }

    errorMsg.style.visibility = 'none'
    board.style.display = 'none'
    status.innerHTML = msg
    status.style.display = 'block'
    menu.style.display = 'block'
})

newGameBt.onclick = newGame
createRoomBt.onclick = createRoom
joinRoomBt.onclick = joinRoom