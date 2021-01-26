import { Injectable } from '@angular/core';
import { SocketService } from '../services/socket.service';
import { InvitationPage } from '../pages/invitation/invitation.page';
import { ModalController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { ServicedbService } from '../services/servicedb.service';
import { ServerService } from '../services/server.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})

/* 
  web socket connections
*/
export class InviatationuserService {

  webSocketInvitation: SocketService;
  roomName: string;
  playerType: string = "friend";
  gameTime: string;
  subscriptions$: Array<any> = [];
  opponentName: string;
  userID: string;
  userName: string;

  constructor(
    private storage: ServicedbService,
    private server: ServerService,
    private modalInvitationController: ModalController,
    public toastController: ToastController,
    private router: Router,
  ) {
    this.webSocketInvitation = new SocketService();
  }

  /* 
    invites the user for a socket connection
    process the ,essgaes in that channel
  */
  connectInvitation(userName: string, userID: string) {
    this.userName = userName;
    this.userID = userID;
    console.log("My user name = ", this.userName)
    console.log("My user ID = ", this.userID)
    this.subscriptions$.push(this.webSocketInvitation.connect("invite?" + this.userID).subscribe( //usermail
      msg => {
        console.log('message received: ', msg);
        if (msg["target"] === this.userName || msg["startGame"]) // u
          this.processInvitationMessage(msg)
      },
      error => {
        if (error.status === 401) {
          this.presentToast("Please sign in!")
        } else if (error.status === 0) {
          this.presentToast(" Please connect to Internet ")
        }
      },
      () => console.log('complete')
    ));
  }

  /* 
    each messgae has its tasks and forwarded to its class members
  */
  processInvitationMessage(message: any) {
    console.log("here", message)
    if (message["isinvitation"]) {
      this.roomName = message["roomName"]
      this.storage.setGameRoom(this.roomName);
      this.playerType = "friend";
      this.gameTime = message["gameTime"]
      const abc = this.presentInvitationModal(message);
      this.opponentName = message["sender"]
    } else if (message["startGame"]) {
      console.log("Starting game ", message)
      this.storage.setPlayerType(this.playerType);
      this.storage.setGameType(this.gameTime);
      this.storage.setGameTitle("Playing with Friend")
      if (this.opponentName === null) {
        this.opponentName = message["player2"]
      }
      this.storage.setOpponentName(this.opponentName)
      this.router.navigate(['/startgame']);
    } else if (message["invitationRejected"]) {
      console.log("invitation rejected")
      this.presentToast("Invitation rejected by the user")
    }
  }

  /* 
    shows error messages
  */
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000
    });
    toast.present();
  }

  /* 
    accepts the user invitation
  */
  async presentInvitationModal(message: any) {
    if (this.storage.getisUserBusy())
      return
    const modal = await this.modalInvitationController.create({
      component: InvitationPage,
      cssClass: 'my-custom-class',
      componentProps: {
        'sender': message["sendername"],
        'gameType': message["gameTime"]
      }
    });
    modal.onDidDismiss()
      .then((data) => {
        console.log(data)
        if (data["data"]) {
          this.storage.setFirstPlayer("false");
          this.joinRoom();
        } else {
          this.webSocketInvitation.send({
            "invitationRejected": true,
            "sender": this.userName
          })
        }
      });
    return await modal.present();
  }

  /* 
    user joins in a particular class/channel
  */
  joinRoom() {
    this.subscriptions$.push(this.server.joinRoom(this.roomName, this.userName).subscribe(response => {
      console.log("response = ", response);
      this.opponentName = response["data"]["player1"]["username"]
      this.webSocketInvitation.send({
        "startGame": true,
        "user1": response["data"]["player1"]["username"],
        "user2": response["data"]["player2"]["username"]
      });
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
    sends a request to the searched user
  */
  sendInvitationRequest(email: string, gameTime: string, username: string) {
    this.gameTime = gameTime;
    console.log("Opponent  user name = ", email)
    this.subscriptions$.push(this.server.getFriendRoom(this.userName).subscribe(response => {
      this.roomName = response["data"]["room_name"];
      this.storage.setFirstPlayer("true");
      this.storage.setGameRoom(this.roomName)
      this.opponentName = email; // change to username
      this.webSocketInvitation.send({
        "isinvitation": true,
        "sendingUserName": this.userName,
        "targetUserName": email,
        "gameType": this.gameTime,
        "gameRoom": response["data"]["room_name"],
        "sendername": username
      });
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
    release resources
  */
  unsubscribe() {
    this.subscriptions$.forEach(element => {
      element.unsubscribe();
    });
  }
}
