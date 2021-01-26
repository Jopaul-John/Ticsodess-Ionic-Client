import { Component, OnInit, Input } from '@angular/core';
import { ServicedbService } from 'src/app/services/servicedb.service';
import { AdmobfreeService } from 'src/app/services/admobfree.service';
import { Plugins } from "@capacitor/core";
import { AdOptions } from "capacitor-admob";
import { ServerService } from 'src/app/services/server.service';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';

const { Share } = Plugins;
const { AdMob } = Plugins;

@Component({
  selector: 'app-game-result',
  templateUrl: './game-result.page.html',
  styleUrls: ['./game-result.page.scss'],
  providers: [
    SocialSharing
  ]
})

/* 
  Displays the user result and save the stats
*/
export class GameResultPage implements OnInit {

  constructor(
    private socialSharing: SocialSharing,
    private storage: ServicedbService,
    private adMob: AdmobfreeService,
    private server: ServerService,
    private router: Router,
    private modalController: ModalController
  ) { }
  @Input() isWin: boolean;
  @Input() isDraw: boolean;
  @Input() isTimeOut: boolean;
  currpoints: number = 0;
  userdata: any;
  isBoostPoints: boolean = true;
  nextLevel: string;
  pointsRewarded: number = 0
  optionsRewardedVideo: AdOptions = {
    adId: "ca-app-pub-3940256099942544/5224354917",
    isTesting: true
  };
  isShare: boolean = false;

  /* 
  shows the current points and levels
  */
  ngOnInit() {
    this.setUpRewardVideo()
    this.userdata = this.storage.getUserStats();
    if (!this.userdata) {
      this.storage.getToken().then(val => {
        this.storage.setServiceToken(val);
        this.server.getUserDetails().subscribe((data => {
          console.log(data)
          this.userdata = data["data"];
          this.currpoints = this.userdata.points;
          this.resultUpdate()
          this.computeLevel();
        }))
      })
    } else {
      this.resultUpdate()
      this.computeLevel()
    }
  }

  /* 
    updates the user stats per input
  */
  resultUpdate() {
    if (this.isWin) {
      this.userdata.points += 10;
      this.pointsRewarded = 10;
    } else if (!this.isDraw && !this.isWin) {
      if (this.userdata.points !== 0)
        this.userdata.points -= 10;
      this.pointsRewarded = -10
    } else {
      this.pointsRewarded = 0
    }
  }

  // async shareFacebook() {
  //   // this.socialSharing.share("ticsodess game").then(() => {
  //   // }).catch((error) => {
  //   //   console.log(error);
  //   // });
  //   let shareRet = await Share.share({
  //     title: 'Ticsodess - Ultimate Tic Tac Toe',
  //     text: '99% people loose in this game',
  //     url: 'http://192.168.10.44:8000/media/images/white.png',
  //     dialogTitle: 'Share your achievements!!'
  //   });
  // }
  shareFacebook() {
    this.socialSharing.shareViaFacebook("Play Ticsodess !!", "http://192.168.10.44:8000/media/images/white.png").then(() => {
    }).catch((error) => {
      console.log(error)
    })
    // this.server.getShareImage({
    //   "userName": this.userdata.username,
    //   "level": this.userdata.level
    // }).subscribe(data => {
    //   this.socialSharing.shareViaFacebook("Play Ticsodess !!", "../../../assets/images/rotatedimage.png","http://192.168.10.44:8100").then(() => {
    //   }).catch((error) => {
    //     console.log(error)
    //   })
    // }, error => {

    // })
  }
  shareInsta() {
    this.socialSharing.shareViaInstagram("Play Ticsodess !!", "http://192.168.10.44:8000/media/images/white.png").then(() => {
    }).catch((error) => {
      console.log(error)
    });
    // this.server.getShareImage({
    //   "userName": this.userdata.username,
    //   "level": this.userdata.level
    // }).subscribe(data => {
    //   this.socialSharing.shareViaInstagram("Play Ticsodess !!", "../../../assets/images/rotatedimage.png").then(() => {
    //   }).catch((error) => {
    //     console.log(error)
    //   });
    // }, error => {

    // });
  }

  /* Plays again and lands to online player view */
  playAgain() {
    if (!this.storage.getIsStatsUpdated()) {
      this.updateStats()
    }
    this.modalController.dismiss();
    this.router.navigate(['/online']);
  }

  /* 
    checks if user has surpassed a level
  */
  computeLevel() {
    if (this.userdata.points / 100 < 1) {
      this.userdata.level = "Noob"
      this.nextLevel = "Intermediate";
    } else if (this.userdata.points / 100 < 2) {
      this.userdata.level = "Intermediate";
      this.nextLevel = "Professional"
    } else if (this.userdata.points / 100 < 3) {
      this.userdata.level = "Professional"
      this.nextLevel = "Master"
    } else if (this.userdata.points / 100 < 4) {
      this.userdata.level = "Master"
      this.nextLevel = "Jedi"
    } else {
      this.nextLevel = null;
      this.userdata.level = "Jedi"
    }
  }

  /* 
    updates the stats
  */
  updateStats() {
    this.server.updateStats({
      "points": this.pointsRewarded,
      "isWin": this.isWin,
      "isDraw": this.isDraw,
      "opponent": this.storage.getOpponentName()
    }).subscribe(response => {
      console.log(response);
      this.storage.setIsStatsUpdated(true);
    }, error => {
      console.log(error);
    })
  }
  /* 
    reward video for boosting points
  */
  watchRewardVideo() {
    AdMob.prepareRewardVideoAd(this.optionsRewardedVideo).then(
      value => {
        AdMob.showRewardVideoAd().then(
          value => {
            console.log("value = ", value);
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
  setUpRewardVideo() {
    AdMob.addListener('onRewardedVideoCompleted', (info: any) => {
      console.log(info)
      this.isBoostPoints = false
      this.userdata.points += 10;
      this.pointsRewarded += 10;
      this.computeLevel();
      if (Math.floor(this.userdata.points / 100) > Math.floor(this.currpoints / 100)) {
        this.isShare = true;
      }
      this.updateStats()
    });
  }
  goBack() {
    this.updateStats()
    this.modalController.dismiss();
  }

}
