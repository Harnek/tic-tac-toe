const socket = io();

const App = {
    room: null,
    playerA: null,
    playerB: null,
    playerAWins: 0,
    playerBWins: 0,
    piece: null,
    turn: null,
    updating: false,
    msgID: null,
    store: window.localStorage,

    init: () => {
        App.attachListeners()

        if ( App.store.getItem('username') ) {
            App.playerA = App.store.getItem('username')
            App.getEl('intro').style.display = 'none'
            App.menu()
        }
    },
    
    intro: () => {
        App.playerA = App.getEl('nameInput').value
        if (App.playerA === '') {
            App.playerA = 'A'
        }
        else {
            App.store.setItem('username', App.playerA)
        }

        App.getEl('intro').style.display = 'none'
        App.menu()
    },

    menu: () => {
        App.getEl('game').style.display = 'none'
        App.getEl('room').style.display = 'none'
        App.getEl('menu').style.display = 'block'
    },

    game: () => {
        const info = { username: App.playerA }

        socket.emit('new game', info, (error, data) => {
            App.room  = data.roomID
            App.piece = data.piece
            App.turn  = data.turn
            
            App.create()
            App.notify('Wait for 2nd player')
        })
    },
    
    room: () => {
        const info = { name: App.playerA }

        socket.emit('new room', info, (error, data) => {
            App.room  = data.roomID
            App.piece = data.piece
            App.turn  = data.turn
        
            App.create()
            App.getEl('room').value = App.room
            App.getEl('room').style.display = 'block'
        })
    },

    join: () => {
        const roomID = App.getEl('roomInput').value
        const info = { name: App.playerA, roomID }

        socket.emit('join room', info, (error, data) => {
            if (error) {
                return App.notify(error)
            }
            App.room  = data.roomID
            App.piece = data.piece
            App.turn  = data.turn
        
            App.getEl('join').style.display = 'none'
            App.create()
        })
    },

    leave: () => {
        if (App.roomID !== null) {
            socket.emit('leave game')
        }
    },

    create: () => {
        App.getEl('menu').style.display = 'none'

        const board = App.getEl('board')
        board.innerHTML = ''

        const table = document.createElement('table')
        for (let i = 0; i < 3; i++) {
            let row = document.createElement('tr')

            for (let j = 0; j < 3; j++) {
                let col = document.createElement('td')
                let div = document.createElement('div')
                col.onclick = (el) => App.move(el)

                if (i < 2) {
                    col.classList.add('borderBt')
                }
                if (j < 2) {
                    col.classList.add('borderRt')
                }

                col.appendChild(div)
                row.appendChild(col)
            }

            table.appendChild(row)
        }

        board.appendChild(table)

        App.getEl('playerA').innerHTML = App.playerA
        App.getEl('playerB').innerHTML = App.playerB || 'Opponent'
        App.getEl('playerAWins').innerHTML = App.playerAWins
        App.getEl('playerBWins').innerHTML = App.playerBWins

        App.getEl('game').style.display = 'flex'
    },

    move: (el) => {
        if (App.updating === true) {
            return
        }
        if (App.turn === false) {
            return App.notify('Opponent\'s turn')
        }
        if (App.playerB === null) {
            return App.notify('Second player has not joined')
        }
        clearInterval(App.msgID)

        App.updating = true
        App.turn = false

        const data = {
            piece: App.piece,
            x: el.target.parentNode.rowIndex,
            y: el.target.cellIndex
        }

        socket.emit('move', data)
    },

    update: (x, y, piece, state) => {
        const board = App.getEl('board').firstChild
        const el = board.rows[x].cells[y].firstChild

        if (piece === 0) {
            el.className = 'circle'
        }
        else {
            el.className = 'cross'
        }

        if (App.piece !== piece) {
            App.turn = true
        }

        if (state !== null && state !== 0) {
            App.over(piece, state)
        }

        el.parentNode.onclick = null
        App.updating = false
    },

    over: (piece, state) => {
        if (App.piece === piece) {
            App.turn = true
            App.playerAWins += 1
            App.notify('You Won')
        }
        else {
            App.turn = false
            App.playerBWins += 1
            App.notify('You Lose')
        }

        socket.emit('rematch')
        App.create()
    },

    reset: () => {
        App.leave()

        App.room = null
        App.playerB = null
        App.playerAWins = 0
        App.playerBWins = 0
        App.piece = null
        App.turn = null
        App.updating = false

        App.menu()
    },

    notify: (msg) => {
        clearInterval(App.msgID)
        
        const el = App.getEl('message')
        el.innerHTML = msg
        el.style.visibility = 'visible'
        
        setTimeout(() => {
            App.msgID = el.style.visibility = 'hidden'
        }, 1500)
    },

    attachListeners: () => {
        App.getEl('continueBt').onclick = App.intro
        App.getEl('newGameBt').onclick  = App.game
        App.getEl('newRoomBt').onclick  = App.room
        App.getEl('joinRoomBt').onclick = () => {
            App.getEl('menu').style.display = 'none'
            App.getEl('join').style.display = 'block'
        }
        App.getEl('joinBt').onclick = App.join
        App.getEl('backBt').onclick = () => {
            App.getEl('join').style.display = 'none'
            App.getEl('menu').style.display = 'block'
        }
        App.getEl('title').onclick      = App.reset
        App.getEl('title').style.cursor = 'pointer'
        App.getEl('darkBt').onclick = App.dark

        App.getEl('room').onclick = (el) => {
            el.target.select();
            if ( document.execCommand('copy') ) {
                el.target.selectionStart = el.target.selectionEnd;
            }
        }

        App.getEl('nameInput').addEventListener('keyup', (event) => {
            if (event.keyCode === 13) {
                event.preventDefault()
                App.getEl('continueBt').click()
            }
        })
    },

    getEl: (id) => {
        return document.getElementById(id)
    },

    dark: () => {
        var el = App.getEl("dark-reader")
        if(el.disabled) {
            el.disabled = false
            App.store.setItem("darkreader", "enabled")
            App.getEl('darkBt').innerHTML = '🌞'
        } else {
            el.disabled = true
            App.store.setItem("darkreader", "disabled")
            App.getEl('darkBt').innerHTML = '🌙'
        }
    }
}


socket.on('update', (data) => {
    App.update(data.x, data.y, data.piece, data.state)
});

socket.on('join game', () => {
    App.playerB = 'Opponent'
    App.notify('Player has joined')
    socket.emit('username');
    App.getEl('room').style.display = 'none'
})

socket.on('leave game', () => {
    App.notify('Player has left')
    App.reset()
})

socket.on('username', (username) => {
    App.playerB = username || 'Opponent'
    App.getEl('playerB').innerHTML = App.playerB
})

App.init()