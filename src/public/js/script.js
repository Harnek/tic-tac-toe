const socket = io();
const board = document.getElementById('board')
const menu = document.getElementById('menu')
const status = document.getElementById('status')
const myProgress = document.getElementById('myProgress')
const myBar = document.getElementById('myBar')
const roomDisplay = eval(document.getElementById('roomDisplay'))
const newGameBt = document.getElementById('newGameBt')
const createRoomBt = document.getElementById('createRoomBt')
const joinRoomBt = document.getElementById('joinRoomBt')
const errorMsg = document.getElementById('error')
let piece = null
let turn = false
let roomID = null
let playerId = null
let username = null
let updating = false

const displayError = (error) => {
    errorMsg.innerHTML = error
    errorMsg.style.visibility = 'visible'
    setTimeout(() => {
        errorMsg.style.visibility = 'hidden'
    }, 7000)
}

const drawUI = () => {
    for (var i = 0; i < board.rows.length; i++) {
        for (var j = 0; j < board.rows[i].cells.length; j++) {
            board.rows[i].cells[j].innerHTML = '<div></div>'
            board.rows[i].cells[j].onclick = function (pos) {
                update(pos);
            }
        }
    }
    board.style.display = 'block';
}

const updateUI = (x, y, p) => {
    const node = board.rows[x].cells[y].firstChild
    if (p === 0){
        node.className = 'circle'
    }
    else {
        node.className = 'cross'
        node.innerHTML = '&#215'
    }
    node.parentNode.onclick = false
}

const loadUI = () => {
    let width = 1

    frame = () => {
        if (width >= 100) {
            clearInterval(id);

            board.style.display = 'none'
            status.style.display = 'none'
            errorMsg.style.visibility = 'hidden'
            
            myProgress.style.display = 'none'
            myBar.style.width = '0%'
            
            menu.style.display = 'block'
        } else {
            width++;
            myBar.style.width = width + '%';
        }
    }

    myProgress.style.display = 'block'
    var id = setInterval(frame, 10);
}

const copyToClipboard = () => {
    roomDisplay.select();
    if (document.execCommand('copy')){
        roomDisplay.selectionStart = roomDisplay.selectionEnd;
        // $('.error').stop().fadeIn(400).delay(3000).fadeOut(400);
    }
}

const update = (pos) => {
    errorMsg.style.visibility = 'hidden'

    if (updating === true){
        return
    }

    if (turn === false){
        return displayError('Wait for your opponent\'s turn')
    }
    updating = true

    const data = {
        roomID,
        piece,
        x: pos.target.parentNode.rowIndex,
        y: pos.target.cellIndex
    }

    socket.emit('UPDATE', data)
}

const newGame = () => {
    socket.emit('NEW_GAME', null, (error, data) => {
        if (error) {
            alert(error)
        }
        else{
            roomID = data.roomID
            playerId = data.playerId
            piece = data.piece
            turn = data.turn

            menu.style.display = 'none';
            errorMsg.style.visibility = 'hidden'
            status.style.display = 'none'
            
            drawUI()   
        }
    })
}

const createRoom = () => {
    socket.emit('CREATE_ROOM', null, (error, data) => {
        if (error) {
            displayError(error)
        }else{
            roomID = data.roomID
            playerId = data.playerId
            piece = data.piece
            turn = data.turn

            menu.style.display = 'none';
            errorMsg.style.visibility = 'hidden'
            status.style.display = 'none'

            drawUI()
            roomDisplay.value = roomID
            roomDisplay.style.display = 'block'
        }
    })
}

const joinRoom = () => {
    let input = prompt("Enter Room Id: ", "")
    const info = {
        roomID: input
    }

    socket.emit('JOIN_ROOM', info, (error, data) => {
        if (error) {
            displayError(error)
        }else{
            roomID = data.roomID
            playerId = data.playerId
            piece = data.piece
            turn = data.turn

            menu.style.display = 'none';
            errorMsg.style.visibility = 'hidden'
            status.style.display = 'none'

            drawUI()
        }
    })
}

socket.on('PLAYER_JOINED', () => {
    displayError('Player 2 has joined')
    roomDisplay.style.display = 'none'
})

socket.on('PLAYER_LEFT', () => {
    console.log("Player 2 Left")
    displayError('Your Opponent has left')
    loadUI()
})

socket.on('UPDATED', (status) => {
    errorMsg.style.visibility = 'hidden'

    console.log(status)

    if (status.error) {
        displayError(status.error)
    }
    else {
        updateUI(status.x, status.y, status.piece)

        if (status.state !== null && status.state !== 0){
            return gameEnd(status.state, status.piece)
        }

        if (piece !== status.piece) {
            turn = true
            // displayError('Your Turn')
        }else{
            turn = false
        }
    }
    updating = false
    console.log("Turn", turn)
});

const gameEnd = (state, p) => {
    let msg = 'Game Draw'

    if (state === 1) {
        msg = (piece === p) ? 'You Won': 'You Lose'
    }

    errorMsg.style.visibility = 'hidden'
    board.style.display = 'none'
    status.innerHTML = msg
    status.style.display = 'block'

    loadUI()
}

newGameBt.onclick = newGame
createRoomBt.onclick = createRoom
joinRoomBt.onclick = joinRoom
roomDisplay.onclick = copyToClipboard