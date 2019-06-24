const socket = io();
let board = document.getElementById('board')
let status = document.getElementById('status')
let newGameBt = document.getElementById('newGameBt')
let errorMsg = document.getElementById('error')
let piece = null
let turn = false
let roomId = null
let playerId = null
let updating = false


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
        errorMsg.innerHTML = 'Wait for your opponent\'s turn'
        errorMsg.style.visibility = "visible"
        setTimeout(() => {
            errorMsg.style.visibility = "hidden"
        }, 7000)
        return
    }
    updating = true

    const data = {
        roomId,
        playerId,
        piece,
        x: pos.target.parentNode.rowIndex,
        y: pos.target.cellIndex
    }

    socket.emit('update', data, (error) => {
        if (error) {
            errorMsg.innerHTML = error
            errorMsg.style.visibility = 'visible'
            setTimeout(() => {
                errorMsg.style.visibility = 'hidden'
            }, 7000)
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
            
            if (data.playerId % 2 == 1){
                turn = true
            }

            newGameBt.style.display = 'none';
            errorMsg.style.visibility = 'none'
            status.style.display = 'none'
            drawUI()
        }
    })
}

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

    errorMsg.style.display = 'none'
    board.style.display = 'none'
    status.innerHTML = msg
    status.style.display = 'block'
    newGameBt.style.display = 'block'
})

newGameBt.onclick = newGame