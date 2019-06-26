const socket = io();

const nameInput = document.getElementById('nameInput')
const continueBt = document.getElementById('continueBt')

const menu = document.getElementById('menu')

const board = document.getElementById('board')
const boardDisplay = document.getElementById('boardDisplay')
const playerName1 = document.getElementById('playerName1')
const playerName2 = document.getElementById('playerName2')
const playerScore1 = document.getElementById('playerScore1')
const playerScore2 = document.getElementById('playerScore2')

const newGameBt = document.getElementById('newGameBt')
const createRoomBt = document.getElementById('createRoomBt')
const joinRoomBt = document.getElementById('joinRoomBt')

const roomDisplay = document.getElementById('roomDisplay')

const endScreen = document.getElementById('endScreen')
const statusDisplay = document.getElementById('statusDisplay')
const playAgainBt = document.getElementById('playAgainBt')
const goMenuBt = document.getElementById('goMenuBt')

const myProgress = document.getElementById('myProgress')
const myBar = document.getElementById('myBar')
const errorDisplay = document.getElementById('errorDisplay')

let roomID   = null
let playerId = null
let piece    = null
let turn     = false
let username = null
let opponent = null
let playerWins = 0
let opponentWins = 0
let updating = false

const displayError = (error) => {
    errorDisplay.innerHTML = error
    errorDisplay.style.visibility = 'visible'
    setTimeout(() => {
        errorDisplay.style.visibility = 'hidden'
    }, 4000)
}

const cleanUI = () => {
    menu.style.display = 'none'
    boardDisplay.style.display = 'none'
    roomDisplay.style.display = 'none'
    endScreen.style.display = 'none'
    myProgress.style.display = 'none'
    errorDisplay.style.visibility = 'hidden'
}

const createBoardUI = () => {
    username = nameInput.value || 'Anonymous'
    playerName1.innerHTML = username
    playerName2.innerHTML = opponent || 'Opponent'
    playerScore1.innerHTML = playerWins
    playerScore2.innerHTML = opponentWins

    for (var i = 0; i < board.rows.length; i++) {
        for (var j = 0; j < board.rows[i].cells.length; j++) {
            board.rows[i].cells[j].innerHTML = '<div></div>'
            board.rows[i].cells[j].onclick = function (pos) {
                update(pos);
            }
            if (i < 2) {
                board.rows[i].cells[j].style.borderBottom = "1px solid black"
            }
            if (j < 2) {
                board.rows[i].cells[j].style.borderRight = "1px solid black"
            }
        }
    }
    boardDisplay.style.display = 'flex';
}

const updateBoardUI = (x, y, p) => {
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

const createMenuUI = () => {
    opponent = null
    let width = 1

    frame = () => {
        if (width >= 100) {
            clearInterval(id);

            cleanUI()
            console.log("CALLED")
            menu.style.display = 'block'
        } else {
            width++;
            myBar.style.width = width + '%';
        }
    }

    myProgress.style.display = 'block'
    var id = setInterval(frame, 3);
}

const copyToClipboard = () => {
    roomDisplay.select();
    if (document.execCommand('copy')){
        roomDisplay.selectionStart = roomDisplay.selectionEnd;
        // $('.error').stop().fadeIn(400).delay(3000).fadeOut(400);
    }
}

const startGame = () => {
    continueBt.parentNode.style.display = 'none'
    createMenuUI()
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

            cleanUI()
            createBoardUI()   
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

            cleanUI()
            createBoardUI()
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

            cleanUI()
            createBoardUI()
        }
    })
}

const update = (pos) => {
    errorDisplay.style.visibility = 'hidden'

    if (updating === true){
        return
    }

    if (turn === false){
        return displayError('Opponent\'s turn')
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

socket.on('PLAYER_JOINED', () => {
    displayError('Player 2 has joined')
    socket.emit('GET_USERNAME', {roomID, username});
    roomDisplay.style.display = 'none'
})

socket.on('PLAYER_LEFT', () => {
    console.log("Player 2 Left")
    displayError('Your Opponent has left')
    leaveRoom()
})

socket.on('SET_USERNAME', (data) => {
    opponent = data
    playerName2.innerHTML = opponent || 'Anonymous'
})

socket.on('UPDATED', (status) => {
    errorDisplay.style.visibility = 'hidden'

    console.log(status)

    if (status.error) {
        displayError(status.error)
    }
    else {
        updateBoardUI(status.x, status.y, status.piece)

        if (piece !== status.piece) {
            turn = true
        }else{
            turn = false
        }

        if (status.state !== null && status.state !== 0){
            return gameEnd(status.state, status.piece)
        }
    }
    updating = false
    console.log("Turn", turn)
});

const gameEnd = (state, p) => {
    let msg = 'Game Draw'

    if (state === 1) {
        if (piece === p) {
            msg = 'You Won'
            playerWins += 1
        }
        else {
            msg = 'You Lose'
            opponentWins += 1
        }
    }
    
    cleanUI()
    statusDisplay.innerHTML = msg
    endScreen.style.display = 'flex'
}

const rematch = () => {
    let status = {
        roomID
    }
    socket.emit('REMATCH', status)
    cleanUI()
    createBoardUI()
    console.log(turn)
}

const leaveRoom = () => {
    socket.emit('LEAVE_ROOM', {roomID})
    roomID   = null
    piece    = null
    turn     = false
    opponent = null
    playerWins = 0
    opponentWins = 0
    updating = false
    createMenuUI()
}

continueBt.onclick = startGame
newGameBt.onclick = newGame
createRoomBt.onclick = createRoom
joinRoomBt.onclick = joinRoom
roomDisplay.onclick = copyToClipboard
playAgainBt.onclick = rematch
goMenuBt.onclick = leaveRoom

nameInput.addEventListener("keyup", (event) => {
    if (event.keyCode === 13) {
        event.preventDefault()
        continueBt.click()
    }
})