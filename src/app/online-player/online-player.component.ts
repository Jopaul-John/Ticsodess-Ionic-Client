import { Component, OnInit } from '@angular/core';
import { ServicedbService } from "../services/servicedb.service"
import { Router } from "@angular/router"
import { ModalPage } from '../pages/modal/modal.page';
import { ModalController } from '@ionic/angular';
import { ServerService } from '../services/server.service';
import { SocketService } from '../services/socket.service';
import { InvitationPage } from '../pages/invitation/invitation.page'
import { AdmobfreeService } from '../services/admobfree.service';
import { ToastController } from '@ionic/angular';
import { InviatationuserService } from '../services/inviatationuser.service';

@Component({
  selector: 'app-online-player',
  templateUrl: './online-player.component.html',
  styleUrls: ['./online-player.component.scss'],
  providers: [
    ModalPage,
    InvitationPage
  ]
})

/* 
  Play game view
  user selects different modes - Ai, Random, Friend
  Game time is selected - 5min, 3 min
*/
export class OnlinePlayerComponent implements OnInit {
  randomNames = ["jjkalady", "ajayk12", "akashM23", "alexjoseph143", "annpriyaApj", "aravind62", "mihirmodh", "sreeshmally", "arjunphazed", "rejoythund", "arjun_madrid", "sinwan_barca", "ramanpad_np", "akhilam_bad_y", "arjun_sant", "sachizDing", "dimblezzSing", "harryMon", "narayabfreakzz", "richardteckard", "kkdKarun", "thommanpete", "vimalKochi", "gmangou", "surajgoa", "thejuwayanad", "mayamma112", "neethucanad", "neemsmala"]
  isFriend = false; // shows the space to search friend
  gameTime = "3"; // sets default game time as 3 minutes 
  playerType = "random"; // sets default player type as random
  friendList: any;
  searchResult: any;
  friendName: string;
  isopponentReady: boolean;
  isLoggedIn: boolean;
  userMail: string;
  isStartButtonPressed: boolean;
  roomName: string;
  roomFullCheckInterval: any;
  webSocket: SocketService;
  webSocketInvitation: SocketService;
  refreshTime: number = 0;
  isbuttondisabled: boolean;
  requestsNumber: number = 1;
  username: string;
  subscriptions$: Array<any> = [];
  gameTitle: string;
  opponentName: string;

  constructor(private storage: ServicedbService,
    private router: Router,
    private modalController: ModalController,
    private server: ServerService,
    private admob: AdmobfreeService,
    public toastController: ToastController,
    private invitationservice: InviatationuserService
  ) {
    this.webSocket = new SocketService();
    this.webSocketInvitation = new SocketService();
  }

  /* 
    loads the user name from db
  */
  ngOnInit() {
    this.storage.getUserName().then((val) => {
      this.username = val
      console.log("user name = ", this.username)
    })
    this.storage.getUserDetails().then((val) => {
      this.userMail = val;
      console.log("user mail = ", this.userMail);
      if (this.userMail !== null) {
        console.log("usermail in not null")
        this.isLoggedIn = true;
      } else {
        console.log("cannot find username in online player")
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions$.forEach(element => {
      element.unsubscribe();
    });
  }

  /* 
    present error messages
  */
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000
    });
    toast.present();
  }

  /* 
    saves game time temporarily 
  */
  setGameTime(event: CustomEvent) {
    this.gameTime = event.detail.value;
  }

  /* 
    Modal for facebook login
  */
  async presentModal() {
    const modal = await this.modalController.create({
      component: ModalPage,
    });
    return await modal.present();
  }

  /* 
    selects the player type
  */
  setPlayerTime(event: CustomEvent) {
    this.playerType = event.detail.value;
    if (event.detail.value === "friend") {
      if (!this.isLoggedIn) {
        this.presentModal();
        return;
      }
      console.log("user name = ", this.userMail)
      this.getRecentFriends();
      this.isFriend = true;
      this.isbuttondisabled = true;
    } else {
      this.searchResult = null;
      this.friendList = null;
      this.isFriend = false;
      this.isbuttondisabled = false;
    }
  }

  /* 
    search friends with the user name, 
    Case insensitve
  */
  searchFriend() {
    this.subscriptions$.push(this.server.getSerachFriend(this.friendName).subscribe(response => {
      console.log(response);
      if (response["error"]) {
        this.presentToast(response["error"]);
      } else {
        this.searchResult = response["data"];
      }
    },
      error => {
        if (error.status === 401) {
          this.presentToast("Please sign in!")
        } else if (error.status === 0) {
          this.presentToast(" Please connect to Internet ")
        }
      }));
  }
  /* 
    sends invitation to the friend
  */
  sendInvitationRequest(email: string) {
    if (this.requestsNumber % 2 == 0) {
      this.admob.showInterstatialAd();
      this.searchFriend();
    }
    this.requestsNumber += 1
    this.invitationservice.sendInvitationRequest(email, this.gameTime, this.username);
  }
  /* 
    starts game
    finds a game room
    connect sockets to the game for group chat/movements
    sets up the opponent type and name
  */
  startGame() {
    let timeout: any;
    this.storage.setPlayerType(this.playerType);
    this.gameTitle = this.playerType;
    this.storage.setGameTitle(this.gameTitle)
    this.storage.setGameType(this.gameTime);
    this.isStartButtonPressed = true;
    this.subscriptions$.push(this.server.findFreeRoom(this.username, this.isFriend).subscribe((response) => {
      console.log("Game Room response = ", response);
      this.roomName = response["data"]["room_name"];
      this.storage.setGameRoom(this.roomName)
      if (this.playerType === "ai") {
        this.isStartButtonPressed = false;
        this.router.navigate(['/startgame']);
      } else {
        this.storage.setGameType("5");
        timeout = setTimeout(() => {
          this.confirmPlayerBot();
        }, 10000)
        this.subscriptions$.push(this.webSocket.connect("gameroom/" + this.roomName + "/").subscribe(
          msg => {
            console.log('message received: ', msg)
            if (msg["startGame"] == true) {
              clearTimeout(timeout);
              if (this.storage.getFirstPlayer()) {
                this.opponentName = msg["player1"]
              } else {
                this.opponentName = msg["player2"]
              }
              this.storage.setOpponentName(this.opponentName);
              this.isStartButtonPressed = false;
              this.router.navigate(['/startgame']);
            }
          },
          error => {
            if (error.status === 401) {
              this.presentToast("Please sign in!")
            } else if (error.status === 0) {
              this.presentToast(" Please connect to Internet ")
            }
          },
          () => console.log('complete')
        ))
        if (response["data"]["is_full"]) {
          console.log("sending full")
          console.log(response["gameModel"])
          this.opponentName = response["gameModel"]["player1"]["username"]
          this.storage.setFirstPlayer("false");
          this.webSocket.send({
            "startGame": true,
            "player1": this.opponentName,
            "player2": response["gameModel"]["player2"]["username"]
          })
        }
      }
    }));
  }

  /* 
    finds the recently played friends
  */
  getRecentFriends() {
    this.subscriptions$.push(this.server.getRecentFriends(this.username).subscribe(response => {
      console.log(response)
      // if (response["data"].length != 0)
      this.friendList = response["data"]
    },
      error => {
        if (error.status === 401) {
          this.presentToast("Please sign in!")
        } else if (error.status === 0) {
          this.presentToast(" Please connect to Internet ")
        }
      }));
  }
  /* 
    refresh to see if user is online
  */
  refreshRecentFriends() {
    this.refreshTime += 1;
    this.getRecentFriends();
    if (this.refreshTime % 2 == 0) {
      this.admob.showInterstatialAd()
      this.refreshTime = 0;
    }
  }
  /* 
    after 10s waiting time, random is forwarded to AI to save user experience
  */
  confirmPlayerBot() {
    console.log("switcing to ai user")
    this.subscriptions$.push(this.server.confirmSecondPlayerasBot(this.roomName).subscribe(response => {
      console.log(response)
      if (response["confirmation"]) {
        this.opponentName = this.getRandomAIName();
        this.gameTitle = "Random Game";
        this.storage.setGameTitle(this.gameTitle);
        this.storage.setPlayerType("ai");
        this.storage.setOpponentName(this.opponentName)
        this.isStartButtonPressed = false;
        this.router.navigate(['/startgame']);
      }
    }, error => {
      if (error.status === 401) {
        this.presentToast("Please sign in!")
      } else if (error.status === 0) {
        this.presentToast(" Please connect to Internet ")
      }
    }));
  }
  /* displays the random ai name */
  getRandomAIName() {
    return this.randomNames[Math.floor(Math.random() * this.randomNames.length)];
  }

}
