module.exports = class Board {
    constructor () {
        this.board = [[null, null, null],
                      [null, null, null],
                      [null, null, null]
                    ]
        this.moves = 0
        this.state = 0
    }

    update(x, y, piece) {
        if ((piece !== 0 && piece !== 1) ||
            x < 0 || x > 2 || y < 0 || y > 2 ||
            this.board[x][y] !== null
            ){
            return false
        }

        this.board[x][y] = piece
        this.moves += 1
        return true
    }

    reset() {
        this.board = [[null, null, null],
                      [null, null, null],
                      [null, null, null]
                    ]
        this.moves = 0
        this.state = 0
    }

    isWin() {
        // Check rows and cols
        for (let i = 0; i < 3; i++) {
            let flagR = (this.board[i][0] === null)? false : true
            let flagC = (this.board[0][i] === null)? false : true
            
            for (let j = 1; j < 3; j++) {
                if (this.board[i][j] !== this.board[i][j - 1]){
                    flagR = false
                }
                if (this.board[j][i] !== this.board[j - 1][i]){
                    flagC = false
                }
            }

            if (flagR || flagC) {
                return true
            }
        }
    
        //check top-down diagonal
        if (this.board[0][0] !== null){
            if (this.board[0][0] === this.board[1][1] && 
                this.board[1][1] === this.board[2][2]) {
                    return true
            }
        }
        // check bottom-up diagonal
        if (this.board[2][0] !== null) {
            if (this.board[2][0] === this.board[1][1] && 
                this.board[1][1] === this.board[0][2]) {
                    return true
            }
        }
    
        return false
    }
    
    // 0 - Ongoing, 1 - Won, 2 - Draw
    getState() {
        if (this.isWin()){
            this.state = 1
        }
        else if (this.moves === 9) {
            this.state = 2
        }
        
        return this.state
    }

    verify() {
        for (let i = 0; i < 3; i++){
            for (let j = 0; j < 3; j++){
                if (this.board[i][j] !== null ||
                    this.board[i][j] !== 0 ||
                    this.board[i][j] !== 1){
                    return false
                }
            }
        }
        return true
    }
}