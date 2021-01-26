// shows the achievements view

import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"
import { ServicedbService } from "../services/servicedb.service"
import { ModalPage } from '../pages/modal/modal.page';
import { ModalController } from '@ionic/angular';
import { ServerService } from '../services/server.service';
import { AdmobfreeService } from '../services/admobfree.service';
import { ToastController } from '@ionic/angular';
import { Plugins } from "@capacitor/core";
import { AdOptions } from "capacitor-admob";
import { AlertController } from '@ionic/angular';

const { AdMob } = Plugins;
@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss'],
})
export class AchievementsComponent implements OnInit {
  optionsRewardedVideo: AdOptions = {
    adId: "ca-app-pub-3940256099942544/5224354917",
    isTesting: true
  };
  userName: string;
  isLoggedIn: boolean = false; // have to change to false
  isEditable: boolean;
  usernameEdit: boolean = false;
  newUserName: string;
  userMail: any;
  userdata: any;
  nextLevel: string;
  hintsRemanining: number = 0;
  showRewardAd: boolean = true;
  subscriptions$: Array<any> = [];

  constructor(private router: Router,
    private storage: ServicedbService,
    public modalController: ModalController,
    private server: ServerService,
    private adMob: AdmobfreeService,
    public toastController: ToastController,
    public alertController: AlertController
  ) {
    this.setUpRewardVideo();
  }

  ngOnInit() {
    // gets remaining hints from local storage 
    this.storage.getRemainingHints().then(val => {
      this.hintsRemanining = val;
      if (!this.hintsRemanining) {
        this.hintsRemanining = 0
      }
    })
    //  reads the username
    this.storage.getUserName().then(val => {
      this.userName = val
    });
    // check if user is logged and reads the user stats
    this.storage.getUserDetails().then(val => {
      this.userMail = val
      if (this.userMail !== null) {
        this.storage.getisLoggedIn().then(val => {
          if (val === "true") {
            this.isLoggedIn = true
          }
          this.getUserDetails();
        });
      }
    });
  }

  ngOnDestroy() {
    // saves the hints and unsubscribe the resources
    this.storage.setRemainingHints(this.hintsRemanining);
    this.subscriptions$.forEach(element => {
      element.unsubscribe();
    });
  }

  goBack() {
    // saves the hints and unsubscribe the resources
    this.storage.setRemainingHints(this.hintsRemanining);
    this.subscriptions$.forEach(element => {
      element.unsubscribe();
    });
    this.router.navigate(['/home'])
  }

  /* 
    reads the user stats
   */
  getUserDetails() {
    this.subscriptions$.push(this.server.getUserDetails().subscribe(response => {
      this.userdata = response["data"];
      if (!this.userdata.imageUrl) {
        this.userdata.imageUrl = "../../assets/images/rotatedimage.png"
      }
      console.log(response["data"]);
      this.isEditable = !response["data"]["usernameUpdated"]
      this.storage.setuserStats(response["data"]);
      if (this.userdata.points / 100 < 1) {
        this.nextLevel = "Intermediate"
      } else if (this.userdata.points / 100 < 2) {
        this.nextLevel = "Professional"
      } else if (this.userdata.points / 100 < 3) {
        this.nextLevel = "Master"
      } else if (this.userdata.points / 100 < 4) {
        this.nextLevel = "Jedi"
      }
    },
      error => {
        console.log(error);
        if (error.status === 401) {
          this.presentModal();
        } else if (error.status === 0) {
          this.presentToast();
        }
      }));
  }

  /* 
    updates the username... One time action
   */
  updateUsername() {
    if (this.newUserName.replace(/\s/g, '').length > 0)
      this.subscriptions$.push(this.server.updateUserName(this.newUserName).subscribe(response => {
        console.log(response)
        if (response["error"]) {
          this.presentAlert(response["error"])
        } else {
          this.isEditable = false
          this.usernameEdit = false
          this.userdata = response["data"];
          this.storage.setUserName(this.userdata.username)
        }
      }, error => {
        console.log(error);
        if (error.status === 401) {
          this.presentModal();
        } else if (error.status === 0) {
          this.presentToast();
        }
      }));
    else {
      this.presentAlert("Please enter the username")
    }
  }
  // sets editable 
  editUserName() {
    this.usernameEdit = true;
    this.isEditable = false
  }
  // cancel updates
  cancelUserNameUpdate() {
    this.usernameEdit = false;
    this.isEditable = true;
  }
  logOut() {
    this.router.navigate(['/home'])
  }
  /*  
   present the login modal
   */
  async presentModal() {
    const modal = await this.modalController.create({
      component: ModalPage,
    });
    modal.onDidDismiss()
      .then((data) => {
        if (data.data) {
          console.log("data from modal = ", JSON.stringify(data["data"]["data"]))
          this.userdata = data["data"]["data"];
          this.isLoggedIn = true;
        }
      });
    return await modal.present();
  }

  logIn() {
    this.presentModal();
  }
  /*   
  allows the user to add hint by watching the rewarded video ads 
   */
  addHint() {
    console.log("Showing Ad")
    if (this.showRewardAd) {
      console.log("inside addhint if")
      this.showRewardAd = false;
      AdMob.prepareRewardVideoAd(this.optionsRewardedVideo).then(
        value => {
          AdMob.showRewardVideoAd().then(
            value => {
              console.log("value = ", value);
              console.log("setting showreward true")
              this.showRewardAd = true;
            },
            error => {
              console.error(error);
            }
          );
        },
        error => {
          console.error(error);
        }
      );
    }
  }
  /*   
  present toast to alert user if any errors like internet connectivity occurs
   */
  async presentToast() {
    const toast = await this.toastController.create({
      message: 'Cannot connect to server.. Please check your Internet Connectivity',
      duration: 3500
    });
    toast.present();
  }
  getHintsRemanining() {
    return this.hintsRemanining;
  }
  /* sets up ad */
  setUpRewardVideo() {
    AdMob.addListener('onRewardedVideoCompleted', () => {
      console.log("rewarded!!!!!!!!!!!!!!!1")
      this.hintsRemanining += 1;
    });
  }
  /*  
   presents alert in case anything wrong with saving new username
   */
  async presentAlert(message: string) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      subHeader: 'Error in saving new username',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
