import { Component } from '@angular/core';
import { Router, RoutesRecognized } from "@angular/router"
import { ServicedbService } from '../services/servicedb.service';
import { AdmobfreeService } from '../services/admobfree.service';
import { filter, pairwise } from 'rxjs/operators';
import { ServerService } from '../services/server.service';
import { SocketService } from '../services/socket.service';
import { InvitationPage } from '../pages/invitation/invitation.page';
import { ModalController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { InviatationuserService } from '../services/inviatationuser.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

/* 
  landing page after the splash screen
*/
export class HomePage {
  showArrow: boolean = true;
  duration: number = 3000;
  userName: string;
  webSocketInvitation: SocketService;
  roomName: string;
  isLoggedIn: boolean;
  playerType: string;
  gameTime: string;
  shouldRoute: boolean = true;
  subscriptions$: Array<any> = [];
  userID: string;
  userMail: string

  /* 
    checks the user authentication
    if user is not registered, a temporary user will be created
  */
  constructor(private router: Router,
    private storage: ServicedbService,
    private admob: AdmobfreeService,
    private server: ServerService,
    private modalInvitationController: ModalController,
    public toastController: ToastController,
    private invitationservice: InviatationuserService,
  ) {
    this.storage.getToken().then(token => {
      if (token !== null) {
        this.storage.setServiceToken(token);
        this.storage.getUserName().then((val) => {
          this.userName = val;
          this.storage.getUserID().then((val) => {
            this.userID = val;
            invitationservice.connectInvitation(this.userName, this.userID);
          });
        });
      }
      else {
        console.log("creating temp user")
        this.subscriptions$.push(this.server.createTemporaryUser().subscribe((response) => {
          console.log("setting token", response)
          this.userMail = response["data"]["email"];
          this.userID = String(response["data"]["id"]);
          this.userName = response["data"]["username"];
          console.log(this.userID)
          this.storage.setUserID(this.userID);
          this.storage.setUserDetails(this.userMail);
          this.storage.setToken(response["token"]);
          this.storage.setUserName(response["data"]["username"]);
          this.storage.setServiceToken(response["token"]);
          invitationservice.connectInvitation(this.userName, this.userID);
        },
          error => {
            console.log(error)
            if (error.status === 401) {
              this.presentToast("Please sign in!")
            } else if (error.status === 0) {
              this.shouldRoute = false;
              this.presentToast(" Please connect to Internet ")
            }
          }));
      }
    })
    this.router.events
      .pipe(filter((evt: any) => evt instanceof RoutesRecognized), pairwise())
      .subscribe((events: RoutesRecognized[]) => {
        if (events[0].urlAfterRedirects === "/online" || events[0].urlAfterRedirects === "/achievements") {
          this.admob.showInterstatialAd();
        }
      });
  }
  /* 
    presents error messages
  */
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000
    });
    toast.present();
  }
  /* 
    release resource
  */
  ngOnDestroy() {
    this.invitationservice.unsubscribe();
    this.subscriptions$.forEach(element => {
      element.unsubscribe();
    });
  }


  /* 
    different route options
  */
  routeOption(event, option) {
    if (this.shouldRoute)
      switch (option) {
        case "online": {
          this.router.navigate(['/online'])
          break;
        }
        case "instructions": {
          this.router.navigate(['/instructions'])
          break;
        }
        case "offline": {
          this.router.navigate(['/offline'])
          break;
        }
        case "achievements": {
          this.router.navigate(['/achievements'])
          break;
        }
        default: {
          this.router.navigate(['/home'])
        }
      }
  }
}
