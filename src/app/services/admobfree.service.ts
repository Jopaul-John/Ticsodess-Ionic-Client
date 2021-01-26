import { Injectable } from '@angular/core';
import { Plugins } from "@capacitor/core";
import { AdOptions } from "capacitor-admob";

const { AdMob } = Plugins;
@Injectable({
  providedIn: 'root'
})

/* 
  Admob class for displaying ads
*/
export class AdmobfreeService {

  optionsInterstitial: AdOptions = {
    adId: "ca-app-pub-3940256099942544/8691691433",
    isTesting: true
  };


  constructor() { }

  showInterstatialAd() {
    AdMob.prepareInterstitial(this.optionsInterstitial).then(
      value => {
        AdMob.showInterstitial().then(
          value => {
            console.log(value); // true
          },
          error => {
            console.error(error); // show error
          }
        );
      },
      error => {
        console.error("Error = ", error);
      }
    );
  }
}
