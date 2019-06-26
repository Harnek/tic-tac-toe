const socket = io();
const board = document.getElementById('board')
const menu = document.getElementById('menu')
const myProgress = document.getElementById('myProgress')
const myBar = document.getElementById('myBar')
const nameInput = document.getElementById('nameInput')
const nameDisplay = document.getElementById('nameDisplay')
const roomDisplay = document.getElementById('roomDisplay')
const statusDisplay = document.getElementById('statusDisplay')

const continueBt = document.getElementById('continueBt')
const newGameBt = document.getElementById('newGameBt')
const createRoomBt = document.getElementById('createRoomBt')
const joinRoomBt = document.getElementById('joinRoomBt')
const errorMsg = document.getElementById('error')
let piece = null
let turn = false
let roomID = null
let playerId = null
let username = null
let oppname  = null
let updating = false

const displayError = (error) => {
    errorMsg.innerHTML = error
    errorMsg.style.visibility = 'visible'
    setTimeout(() => {
        errorMsg.style.visibility = 'hidden'
    }, 4000)
}

const cleanUI = () => {
    board.style.display = 'none'
    menu.style.display = 'none'
    myProgress.style.display = 'none'
    nameInput.style.display = 'none'
    statusDisplay.style.display = 'none'
    roomDisplay.style.display = 'none'
    nameDisplay.style.display = 'none'
    continueBt.style.display = 'none'
    errorMsg.style.visibility = 'hidden'
}

const createBoardUI = () => {
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
    board.style.display = 'block';
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
    oppname = null
    let width = 1

    frame = () => {
        if (width >= 100) {
            clearInterval(id);

            cleanUI()
            menu.style.display = 'block'
        } else {
            width++;
            myBar.style.width = width + '%';
        }
    }

    myProgress.style.display = 'block'
    var id = setInterval(frame, 5);
}

const copyToClipboard = () => {
    roomDisplay.select();
    if (document.execCommand('copy')){
        roomDisplay.selectionStart = roomDisplay.selectionEnd;
        // $('.error').stop().fadeIn(400).delay(3000).fadeOut(400);
    }
}

const startGame = () => {
    username = nameInput.value || 'Anonymous'

    continueBt.parentNode.style.display = 'none'
    createMenuUI()
}

const newGame = () => {
    socket.emit('NEW_GAME', username, (error, data) => {
        if (error) {
            alert(error)
        }
        else{
            roomID = data.roomID
            playerId = data.playerId
            piece = data.piece
            turn = data.turn

            cleanUI()
            nameDisplay.innerHTML = '<span>' + username +'</span>' + '<span>Waiting...</span>'
            nameDisplay.style.display = 'flex'
            createBoardUI()   
        }
    })
}

const createRoom = () => {
    socket.emit('CREATE_ROOM', username, (error, data) => {
        if (error) {
            displayError(error)
        }else{
            roomID = data.roomID
            playerId = data.playerId
            piece = data.piece
            turn = data.turn

            cleanUI()
            nameDisplay.innerHTML = '<span>' + username +'</span>' + '<span>Waiting...</span>'
            nameDisplay.style.display = 'flex'
            createBoardUI()
            roomDisplay.value = roomID
            roomDisplay.style.display = 'block'
        }
    })
}

const joinRoom = () => {
    let input = prompt("Enter Room Id: ", "")
    const info = {
        username: username,
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
            nameDisplay.innerHTML = '<div id="empty"></div>' + '<span>' + username +'</span>' + '<span style="float: right;">Anonymous</span>'
            nameDisplay.style.display = 'flex'
            createBoardUI()
        }
    })
}

const update = (pos) => {
    errorMsg.style.visibility = 'hidden'

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

socket.on('PLAYER_JOINED', (data) => {
    displayError('Player 2 has joined')
    roomDisplay.style.display = 'none'
})

socket.on('PLAYER_LEFT', () => {
    console.log("Player 2 Left")
    displayError('Your Opponent has left')
    createMenuUI()
})

socket.on('UPDATED', (status) => {
    errorMsg.style.visibility = 'hidden'

    console.log(status)

    if (status.error) {
        displayError(status.error)
    }
    else {
        updateBoardUI(status.x, status.y, status.piece)

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
    
    cleanUI()
    statusDisplay.innerHTML = msg
    statusDisplay.style.display = 'flex'
    
    createMenuUI()
}

continueBt.onclick = startGame
newGameBt.onclick = newGame
createRoomBt.onclick = createRoom
joinRoomBt.onclick = joinRoom
roomDisplay.onclick = copyToClipboard

nameInput.addEventListener("keyup", (event) => {
    if (event.keyCode === 13) {
        event.preventDefault()
        continueBt.click()
    }
})