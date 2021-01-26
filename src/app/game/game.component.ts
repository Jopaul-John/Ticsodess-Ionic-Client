import { Component, OnInit, Renderer2, ElementRef, ViewChild, RendererStyleFlags2 } from '@angular/core';
import { Board } from './board';
import { ServicedbService } from '../services/servicedb.service';
import { AdmobfreeService } from '../services/admobfree.service';
import { ModalController } from '@ionic/angular';
import { GameResultPage } from '../pages/game-result/game-result.page';
import { Timer } from './timer';
import { ServerService } from '../services/server.service';
import { Player } from '../player';
import { SocketService } from '../services/socket.service';
import { ToastController } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  providers: [
    Board,
  ],
})

/* 
  Single class to play AI, Random and friends game
  Opponent player changes with different mode
  Game time changes with different modes
*/
export class GameComponent implements OnInit {

  @ViewChild('boardInitialize')
  public boardDiv: ElementRef;


  playerType: string;
  gameTime: number;
  slideOpts = {
    initialSlide: 0,
    speed: 0,
    autoplay: {
      delay: 750,
      stopOnLastSlide: true
    },
  };
  isBoardReady: boolean;
  isTurn: boolean = false
  isWin: boolean = false;
  isDraw: boolean = false;
  timeOut: boolean = false;
  isGameOver: boolean = false;
  firstPlayer: boolean = false;

  player: Player;
  opponent: Player;
  webSocket: SocketService;
  gameRoom: string;
  hintsRemaining: number;
  hintMove = -1;
  isShowHint: boolean = true;
  subscriptions$: Array<any> = [];
  buttonHeight: any;
  gameTitle: string;
  opponentName: string;

  constructor(
    private board: Board,
    private renderer: Renderer2,
    private el: ElementRef,
    private storage: ServicedbService,
    private adMobFree: AdmobfreeService,
    public modalController: ModalController,
    private server: ServerService,
    public toastController: ToastController,
    public alertController: AlertController,
    private platform: Platform,
    private router: Router,
  ) {
    this.player = new Player();
    this.opponent = new Player();
    this.webSocket = new SocketService();
    this.platform.backButton.subscribeWithPriority(10, () => {
      this.checkBackButton()
    });
  }

  /* 
    presents alert if user tries to exit while playing
  */
  checkBackButton() {
    console.log("goinf back")
    if (!this.isGameOver) {
      this.presentAlert("If you quit in the middle of the game 20 points will be reduced");
    }
  }

  /* 
    presents different alerts to user like exiting
  */
  async presentAlert(message: string) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      subHeader: 'Warning',
      message: message,
      buttons: ['Continue game', "Okay"]
    });
    await alert.present();
  }

  /* 
    initialize the board
    checks the user type and game type
    checks the game time
    sets the user busy stats, hence no invitation notification is served
    finds the turn
    starts the game time counter
    */
  ngOnInit() {
    /*
    Checks different use cases
    this.isWin = true;
    this.isDraw = false
    this.showResultModal(); 
    friend, random, ai, offline
     */
    this.gameTitle = this.storage.getGameTitle();
    this.opponentName = this.storage.getOpponentName() || "AI"
    this.storage.getRemainingHints().then(val => {
      this.hintsRemaining = val
      if (!this.hintsRemaining) {
        this.hintsRemaining = 0;
      }
    });
    this.storage.setisUserBusy(true);
    this.playerType = this.storage.getPlayerType() || "ai";
    this.gameTime = parseInt(this.storage.getGameType()) || 5;
    console.log("the player type = ", this.playerType, this.gameTime)
    if (this.player.name == null) {
      this.storage.getUserName().then(val => {
        this.player.name = val;
      });
    }
    this.subscriptions$.push(this.server.setBusyStats(true).subscribe(response => {
      console.log("user is busy")
    }));
    if (this.storage.getFirstPlayer() === "false") {
      this.firstPlayer = false;
      this.isTurn = false;
    } else {
      this.isTurn = true;
      this.firstPlayer = true;
    }
    console.log("Am i playeing first? ", this.firstPlayer);
    console.log("Game Time = ", this.gameTime);
    if (this.gameTime > 0) {
      this.player.timer = new Timer(this.gameTime * 60);
      this.opponent.timer = new Timer(this.gameTime * 60);
      this.subscriptions$.push(this.player.timer.isTimeOverSubject().subscribe(() => {
        this.isWin = false;
        this.timeOut = true;
        this.showResultModal();
      }));
      this.subscriptions$.push(this.opponent.timer.isTimeOverSubject().subscribe(() => {
        this.isWin = true;
        this.timeOut = true
        this.showResultModal();
      }));
    }
    if (this.playerType === "random" || this.playerType === "friend") {
      this.gameRoom = this.storage.getGameRoom();
      console.log("Connecting to room ", this.gameRoom)
      this.subscriptions$.push(this.webSocket.connect("gameroom/" + this.gameRoom + "/").subscribe(
        msg => {
          console.log('message received: ', msg)
          this.processMoveMessage(msg)
        },
        err => {
          if (err.status === 401) {
            this.presentToast("Please sign in!")
          } else if (err.status === 0) {
            this.presentToast(" Please connect to Internet ")
          }
        },
        () => console.log('complete')
      ))
    }
  }
  /* terminates the current user connection */
  goBack() {
    this.presentAlert("You are exiting the game without completing")
    this.webSocket.terminate()
    this.router.navigate(['/online'])
  }
  /* 
    process the websocket messages
  */
  processMoveMessage(message: any) {
    console.log("message = ", message);
    if (message["isMove"]) {
      const button = message["move"];
      const player = message["player"];
      const playerVal = message["playerValue"];
      if (this.player.name !== player) {
        this.drawOpponentMarker(button)
        this.isTurn = true; // after msg recieved user should play
      }
    } else if (message["isexit"]) {
      this.presentAlert(message["player"] + " exited the game ! You will be redirected to lobby")
      this.router.navigate(["/online"])
    }
  }

  /* 
    sets up the board after init
  */
  ngAfterViewInit() {
    this.setupBoard();
  }

  /* 
    release all resources used and saves the remaining hints
  */
  ngOnDestroy() {
    if (this.hintsRemaining !== 0) {
      this.hintsRemaining -= 1
    }
    this.storage.setRemainingHints(this.hintsRemaining);
    if (!this.isGameOver) {
      this.webSocket.send({
        "player": this.player.name,
        "isexit": true
      });
    }
    this.storage.setisUserBusy(false);
    this.server.setBusyStats(false);
    this.webSocket.terminate()
    try {
      this.subscriptions$.forEach(element => {
        element.unsubscribe();
      });
    } catch (error) {
      console.log(error)
    }
  }
  /* 
    setup the board and buttons with positions
    different classes are allocated to show the button states
    event handlers are included to get the button click
  */
  setupBoard() {
    var buttonPositions = this.board.gameBoard();
    this.buttonHeight = buttonPositions[0];
    this.buttonHeight = Math.floor(parseInt(this.buttonHeight) * 0.99);
    const flags = RendererStyleFlags2.DashCase | RendererStyleFlags2.Important;
    for (var key in buttonPositions[2]) {
      const button = this.renderer.createElement('ion-button');
      this.renderer.setStyle(button, "position", "absolute");
      this.renderer.setStyle(button, 'height', buttonPositions[0] + "px", flags);
      this.renderer.setStyle(button, 'width', buttonPositions[1] + "px", flags);
      this.renderer.setStyle(button, 'left', buttonPositions[2][key][0] + "px", flags);
      this.renderer.setStyle(button, 'top', buttonPositions[2][key][1] + "px", flags);
      this.renderer.setAttribute(button, 'value', key);
      this.renderer.setAttribute(button, 'ion-button', "");
      this.renderer.setAttribute(button, 'id', "number_" + key);
      this.renderer.setAttribute(button, "color", "medium");
      this.renderer.setAttribute(button, "class", "tile");
      this.renderer.appendChild(this.boardDiv.nativeElement, button);
      this.renderer.listen(button, 'click', () => this.playerPlayed(button));
    }
    if (this.firstPlayer) {
      this.player.value = -1;
      this.opponent.value = 1;
    } else {
      this.player.value = 1;
      this.opponent.value = -1;
    }
  }

  /* 
    Goes to ai and get best available moves
  */
  showHint() {
    if (this.hintsRemaining == 0) {
      this.presentToast("You dont have any hints remaining, please go to 'Achievements' to collect hints");
    } else if (this.board.lastMove === null) {
      this.presentToast("You cannot get hint for the very first move !");
    } else if (this.isShowHint) {
      this.isShowHint = false;
      this.subscriptions$.push(this.server.getAIMove(this.board.board, this.board.boardList, this.board.player, this.board.lastMove).subscribe((response) => {
        console.log("Opponent Move = ", response);
        this.hintMove = response["move"];
        const button = this.el.nativeElement.querySelector("#number_" + this.hintMove);
        this.renderer.addClass(button, "bestmove");
        this.hintsRemaining -= 1;
        this.presentToast(" Remaining hints : " + this.hintsRemaining);
        this.isShowHint = true;
      },
        error => {
          if (error.status === 401) {
            this.presentToast("Please sign in!")
          } else if (error.status === 0) {
            this.presentToast(" Please connect to Internet ")
          }
        }));
    }
  }

  /* 
    shows different alert messages like connectivity/ errors
  */
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000
    });
    toast.present();
  }
  /* 
    finds the marker of current user, using lottie player
  */
  getMarker(playerValue: number) {
    const marker = this.renderer.createElement("lottie-player")
    this.renderer.setAttribute(marker, "slot", "end")
    this.renderer.setAttribute(marker, "autoplay", "")
    this.renderer.setStyle(marker, 'height', this.buttonHeight + "px");
    this.renderer.setStyle(marker, 'width', this.buttonHeight + "px");
    if (playerValue == -1) {
      this.renderer.setAttribute(marker, "src", "../../assets/customsvg/zero.json")
    } else {
      this.renderer.setAttribute(marker, "src", "../../assets/customsvg/cross.json")
    }
    return marker;
  }
  /* 
    draws the marker and button is disabled
  */
  playerPlayed(buttonId: any) {
    if (!this.isGameOver) {
      if (this.isTurn) {
        this.disableButton(buttonId);
        this.drawMarker(buttonId);
      }
    }
  }
  /* 
    set the board state ready
  */
  startGame() {
    this.isBoardReady = true;
  }

  /* 
    finds the opponent move
    if the opponent is AI, then best move is found by using api call to server
    else the the move is send to opponent using sockets
  */
  getOpponentMove(buttonId: any) {
    this.isTurn = !this.isTurn;
    let opponentMove: number;
    if (this.playerType === "ai") {
      this.server.getAIMove(this.board.board, this.board.boardList, this.board.player, this.board.lastMove).subscribe((response) => {
        console.log("Opponent Move = ", response);
        opponentMove = response["move"];
        this.drawOpponentMarker(opponentMove);
      },
        error => {
          if (error.status === 401) {
            this.presentToast("Please sign in!")
          } else if (error.status === 0) {
            this.presentToast(" Please connect to Internet ")
          }
        });
    } else if (this.playerType === "friend" || this.playerType === "random") {
      this.webSocket.send({
        "player": this.player.name,
        "move": buttonId,
        "value": this.player.value,
        "isMove": true
      });
    }
  }

  /* 
    returns the player remaining time
  */
  getPlayerTime() {
    if (!this.isGameOver)
      return Math.floor(this.player.timer.totalTime / 60) + ":" + this.player.timer.totalTime % 60;
  }

  /* 
    returns opponent playing time
  */
  getOpponentTime() {
    if (!this.isGameOver)
      return Math.floor(this.opponent.timer.totalTime / 60) + ":" + this.opponent.timer.totalTime % 60;
  }

  /* 
    disables button after clicked
  */
  disableButton(buttonId: any) {
    this.renderer.setAttribute(buttonId, "disabled", "");
  }

  /* 
    start/stop timer according to player turn
  */
  makeTimeChange() {
    if (!this.isTurn) {
      this.player.timer.startTimer();
      this.opponent.timer.pauseTimer();
    } else {
      this.opponent.timer.startTimer();
      this.player.timer.pauseTimer();
    }
  }
  /* 
    shows the position of last played button
  */
  lastPlayed(button: any) {
    if (this.board.lastMove !== null) {
      const previousButton = this.el.nativeElement.querySelector("#number_" + this.board.lastMove);
      this.renderer.removeClass(previousButton, "lastPlayed")
      this.renderer.addClass(button, "lastPlayed");
    }
  }

  /* 
    marks the user marker
    checks if the game has a result and shows the result if any
    saves the move and disable the subboards if any
  */
  drawMarker(buttonId: any) {
    if (this.hintMove !== -1) {
      console.log("removing attribute")
      const button = this.el.nativeElement.querySelector("#number_" + this.hintMove);
      this.renderer.removeClass(button, "bestmove")
    }
    const buttonNumber = parseInt(buttonId.id.split("number_")[1]);
    this.lastPlayed(buttonId);
    this.renderer.appendChild(buttonId, this.getMarker(this.board.player)); //set ups marker
    this.board.makeMove(buttonNumber); // register move
    if (this.board.checkWin()) {
      this.isWin = true;
      this.player.timer.pauseTimer();
      this.opponent.timer.pauseTimer();
      this.showResultModal();
    } else if (this.board.checkDraw()) {
      this.player.timer.pauseTimer();
      this.opponent.timer.pauseTimer();
      this.isDraw = true;
      this.showResultModal()
    } else if (this.player.timer.isTimeOver) {
      this.isWin = false;
    }
    this.lockGrid(buttonNumber);
    this.makeTimeChange();
    this.board.player *= -1;
    this.getOpponentMove(buttonNumber);
  }

  /* 
    same as draw marker, but for opponent
  */
  drawOpponentMarker(opponentMove: number) {
    const button = this.el.nativeElement.querySelector("#number_" + opponentMove);
    this.lastPlayed(button);
    this.renderer.appendChild(button, this.getMarker(this.board.player));
    this.board.makeMove(opponentMove);
    if (this.board.checkWin()) {
      this.isWin = false;
      this.player.timer.pauseTimer();
      this.opponent.timer.pauseTimer();
      this.showResultModal();
    } else if (this.board.checkDraw()) {
      this.player.timer.pauseTimer();
      this.opponent.timer.pauseTimer();
      this.isDraw = true;
      this.showResultModal()
    } else if (this.opponent.timer.isTimeOver) {
      this.isWin = true;
    }
    this.lockGrid(opponentMove);
    this.makeTimeChange();
    this.isTurn = !this.isTurn;
    this.board.player *= -1;
  }

  /* 
    locks a grid if the suboard is won by a user
  */
  lockGrid(move: number) {
    const category = move % 9;
    console.log(category);
    console.log(this.board.boardList);
    if (this.board.boardList[category] != 0) {
      this.free_for_all();
    }
    else {
      var nextRange = category * 9;
      this.enableButton(nextRange, nextRange + 9);
    }
  }
  /* 
    enables button to unlock the next moves
  */
  enableButton(lower_limit: number, upper_limit: number) {
    this.lockAll();
    for (let i = lower_limit; i < upper_limit; i++) {
      if (this.board.board[i] == 0) {
        var button = this.el.nativeElement.querySelector("#number_" + i);
        this.renderer.removeAttribute(button, "disabled");
      }
    }
  }
  /* 
    lock all the buttons
  */
  lockAll() {
    let buttons = this.el.nativeElement.querySelectorAll('.tile');
    for (let i = 0; i < buttons.length; i++) {
      this.renderer.setAttribute(buttons[i], "disabled", "");
    }
  }
  /* 
    when user directs a move to already conquered place, free for all is called
  */
  free_for_all() {
    this.lockAll();
    for (let i = 0; i < 9; i++) {
      if (this.board.boardList[i] == 0) {
        var limit = i * 9;
        for (let j = limit; j < (limit + 9); j++) {
          if (this.board.board[j] == 0) {
            var button = this.el.nativeElement.querySelector("#number_" + j);
            this.renderer.removeAttribute(button, "disabled", null);
          }
        }
      }
    }
  }
  /* Shows the game result and updates the user stats */
  async showResultModal() {
    if (!this.isGameOver) {
      this.isGameOver = true;
      const modal = await this.modalController.create({
        component: GameResultPage,
        componentProps: {
          'isWin': this.isWin,
          'isDraw': this.isDraw,
          'isTimeOut': this.timeOut
        }
      });
      this.storage.setRemainingHints(this.hintsRemaining);
      modal.onDidDismiss().then(() => {
        console.log("Result modal dismissed");
        console.log(this.storage.getIsStatsUpdated())
        if (!this.storage.getIsStatsUpdated()) {
          console.log("pushing stats")
          this.subscriptions$.push(this.server.updateStats({
            "points": null,
            "isWin": this.isWin,
            "isDraw": this.isDraw,
            "opponent": this.storage.getOpponentName()
          }).subscribe(response => {
            this.storage.setIsStatsUpdated(true);
          }, error => {
            console.log(error)
          }));
        }
      })
      return await modal.present();
    }
  }
}
