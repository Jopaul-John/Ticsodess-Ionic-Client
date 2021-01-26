
/* Loads the board, checks the available moves, returns the button positions and checks if there is a win or lose*/
export class Board {

    board: number[] = new Array(81).fill(0);
    boardList: number[] = new Array(9).fill(0);
    buttonPos = {};
    lastMove = null;
    player = -1;
    position1 = -1;
    position2 = -1;

    constructor() { }

    /* 
        returns the board with an list of button positions to fit the button with their respective positions
    */
    gameBoard() {
        var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        var aspectratio = height / width;
        if (aspectratio <= 1.5) {
            var gamewidth = width;
            var gameheight = width; // making the square
        } else {
            var gamewidth = width;
            var gameheight = width //(1 + aspectratio - 1.5) * width; //rectangle
        }
        console.log("width, height = ", gamewidth, gameheight);
        var buttonHeight = Math.floor(gameheight / 9.4);
        var buttonWidth = Math.floor(gamewidth / 9.4);
        var freePixelWidth = width - buttonWidth * 9;
        var smallGap = freePixelWidth / 16;
        var bigGap = smallGap * 4;
        var top = (height - width) / aspectratio, pos1 = smallGap, pos2 = 3 * (buttonWidth + smallGap) + bigGap, pos3 = 2 * pos2 - smallGap;
        for (var k = 0; k <= 54; k = k + 27) {
            for (var i = k; i < (k + 9); i = i + 3) {
                for (var j = i; j < (i + 3); j++) {
                    this.buttonPos[j] = [pos1, top + smallGap];
                    pos1 += buttonWidth + smallGap;

                    this.buttonPos[j + 9] = [pos2, top + smallGap];
                    pos2 += buttonWidth + smallGap;

                    this.buttonPos[j + 18] = [pos3, top + smallGap]
                    pos3 += buttonWidth + smallGap;
                }
                pos1 = smallGap, pos2 = 3 * (buttonWidth + smallGap) + bigGap, pos3 = 2 * pos2 - smallGap; top += (buttonHeight + smallGap);
            }
            top = top + bigGap * 0.75;
        }
        return [buttonHeight, buttonWidth, this.buttonPos];
    }
    /* 
    Returns the available positions to play
    */
    availableMoves() {
        var moves = [];
        if (this.lastMove == null) {
            for (var i = 0; i < this.board.length; i++) {
                if (this.board[i] == 0) moves.push(i);
            }
        } else if (this.boardList[this.lastMove % 9] != 0) {
            var ranges = []
            for (var i = 0; i < this.boardList.length; i++) {
                if (this.boardList[i] == 0) ranges.push(i);
            }
            ranges.forEach(element => {
                var initial = element * 9;
                for (var i = initial; i < (initial + 9); i++) {
                    if (this.board[i] == 0) moves.push(i);
                }
            });
        } else {
            var nextRange = (this.lastMove % 9) * 9;
            for (var i = nextRange; i < (nextRange + 9); i++) {
                if (this.board[i] == 0) moves.push(i);
            }
        }
        return moves;
    }
    /* 
        makes a user move 
    */
    makeMove(move: number) {
        this.board[move] = this.player;
        this.lastMove = move;
        this.checkSubBoard();
    }
    /* 
        checks if game over, win/lose or draw
    */
    isGameOver() {
        if (this.checkWin(this.boardList) || this.boardList.every(item => item != 0))
            return true;
        else
            return false;
    }

    /* 
        checks if there is sub board win, to block user playing in that region
    */
    checkSubBoard() {
        var boardRange = Math.floor(this.lastMove / 9) * 9;
        var subBoard = this.board.slice(boardRange, boardRange + 9);
        console.log("subboard = ", subBoard);
        if (this.checkWin(subBoard, boardRange))
            this.boardList[Math.floor(this.lastMove / 9)] = this.player;
        else if (subBoard.every(item => item != 0))
            this.boardList[Math.floor(this.lastMove / 9)] = -2;
    }

    /* 
        checks if the user wins the game/sub board
    */
    checkWin(board = this.boardList, boardRange = -1) {
        let win = false;
        for (var i = 0; i < 3; i++) {
            if (board[i * 3] == this.player && board[i * 3 + 1] == this.player && board[i * 3 + 2] == this.player) {
                win = true;
                this.position1 = i * 3;
                this.position2 = i * 3 + 2;
                break;
            }
            if (board[i] == this.player && board[i + 3] == this.player && board[i + 6] == this.player) {
                win = true;
                this.position1 = i;
                this.position2 = i + 6;
                break;
            }
        }
        if (board[0] == this.player && board[4] == this.player && board[8] == this.player) {
            win = true;
            this.position1 = 0;
            this.position2 = 8;
        }
        if (board[2] == this.player && board[4] == this.player && board[6] == this.player) {
            win = true;
            this.position1 = 2;
            this.position2 = 6;
        }
        return win
    }
    /* 
     checks if there is a draw
    */
    checkDraw() {
        let draw = false;
        if (this.boardList.every(item => item != 0))
            draw = true;
        return draw;
    }
}