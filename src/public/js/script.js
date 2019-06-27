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
const newRoomBt = document.getElementById('createRoomBt')
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
let playerWins   = 0
let opponentWins = 0
let updating = false
let localStorage = window.localStorage;

const cleanUI = () => {
    menu.style.display            = 'none'
    boardDisplay.style.display    = 'none'
    roomDisplay.style.display     = 'none'
    endScreen.style.display       = 'none'
    myProgress.style.display      = 'none'
    errorDisplay.style.visibility = 'hidden'
}

const createBoardUI = () => {
    cleanUI()
    playerName1.innerHTML  = username
    playerName2.innerHTML  = opponent || 'wait...'
    playerScore1.innerHTML = playerWins
    playerScore2.innerHTML = opponentWins

    for (var i = 0; i < board.rows.length; i++) {
        for (var j = 0; j < board.rows[i].cells.length; j++) {
            board.rows[i].cells[j].innerHTML = '<div></div>'
            board.rows[i].cells[j].onclick = function (el) {
                update(el);
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
            width += 5;
            myBar.style.width = width + '%';
        }
    }

    myProgress.style.display = 'block'
    var id = setInterval(frame, 1);
}

const startGame = () => {
    username = nameInput.value || 'Anonymous'
    continueBt.parentNode.style.display = 'none'
    localStorage.setItem('username', username)
    createMenuUI()
}

const newGame = () => {
    const info = {
        username
    }
    socket.emit('NEW_GAME', info, (error, data) => {
        if (error) {
            alert(error)
        }
        else{
            roomID = data.roomID
            playerId = data.playerId
            piece = data.piece
            turn = data.turn

            createBoardUI()   
        }
    })
}

const newRoom = () => {
    const info = {
        username
    }
    socket.emit('NEW_ROOM', info, (error, data) => {
        if (error) {
            displayError(error)
        }else{
            roomID = data.roomID
            playerId = data.playerId
            piece = data.piece
            turn = data.turn

            createBoardUI()
            roomDisplay.value = roomID
            roomDisplay.style.display = 'block'
        }
    })
}

const joinRoom = () => {
    const input = prompt("Enter Room Id: ", "")
    const info = {
        username,
        roomID: input
    }

    socket.emit('JOIN_ROOM', info, (error, data) => {
        if (error) {
            displayError(error)
        }else{
            roomID = input
            playerId = data.playerId
            piece = data.piece
            turn = data.turn

            createBoardUI()
        }
    })
}

const update = (el) => {
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
        x: el.target.parentNode.rowIndex,
        y: el.target.cellIndex
    }

    console.log(data)

    socket.emit('UPDATE', data)
}

socket.on('UPDATED', (data) => {
    errorDisplay.style.visibility = 'hidden'

    console.log(data)

    if (data.error) {
        displayError(data.error)
    }
    else {
        updateBoardUI(data.x, data.y, data.piece)

        if (piece !== data.piece) {
            turn = true
        }else{
            turn = false
        }

        if (data.state !== null && data.state !== 0){
            gameEnd(data.state, data.piece)
        }
    }
    updating = false
    console.log("Turn", turn)
});

socket.on('PLAYER_JOINED', () => {
    displayError('Player 2 joined')
    socket.emit('GET_USERNAME');
    roomDisplay.style.display = 'none'
})

socket.on('PLAYER_LEFT', () => {
    console.log("Player 2 Left")
    displayError('Your Opponent has left')
    leaveRoom()
})

socket.on('SET_USERNAME', (username) => {
    opponent = username
    playerName2.innerHTML = opponent || 'Anonymous'
})

const gameEnd = (state, p) => {
    let msg = 'Game Draw'

    if (state === 1) {
        if (piece === p) {
            msg = 'You Won'
            playerWins += 1
            turn = true
        }
        else {
            msg = 'You Lose'
            opponentWins += 1
            turn = false
        }
    }

    //TODO: Display status message
    socket.emit('REMATCH')
    createBoardUI()
    displayError(msg)
    console.log("Turn", turn)
}

const leaveRoom = () => {
    if (roomID === null) {
        return
    }
    socket.emit('LEAVE_ROOM')
    roomID   = null
    piece    = null
    turn     = false
    opponent = null
    playerWins   = 0
    opponentWins = 0
    updating = false
    createMenuUI()
}

const displayError = (error) => {
    errorDisplay.innerHTML = error
    errorDisplay.style.visibility = 'visible'
    setTimeout(() => {
        errorDisplay.style.visibility = 'hidden'
    }, 4000)
}

const copyToClipboard = () => {
    roomDisplay.select();
    if (document.execCommand('copy')){
        roomDisplay.selectionStart = roomDisplay.selectionEnd;
        // $('.error').stop().fadeIn(400).delay(3000).fadeOut(400);
    }
}

const dark_toggle = () => {
    var el1 = document.getElementById("dark-reader");
    if(el1.disabled) {
        el1.disabled = false;
        localStorage.setItem("darkreader", "enabled");
    } else {
        el1.disabled = true;
        localStorage.setItem("darkreader", "disabled");
    }
}

const app = () => {
    username = localStorage.getItem('username')
    if (username && username !== 'Anonymous') {
        nameInput.value = username
        nameInput.selectionStart = nameInput.selectionEnd = 10
    }

    continueBt.onclick = startGame
    newGameBt.onclick = newGame
    newRoomBt.onclick = newRoom
    joinRoomBt.onclick = joinRoom
    roomDisplay.onclick = copyToClipboard
    // playAgainBt.onclick = rematch
    goMenuBt.onclick = leaveRoom

    nameInput.addEventListener("keyup", (event) => {
        if (event.keyCode === 13) {
            event.preventDefault()
            continueBt.click()
        }
    })

    document.getElementById("title").onclick = leaveRoom
    document.getElementById("title").style.cursor = "pointer"
}

app()