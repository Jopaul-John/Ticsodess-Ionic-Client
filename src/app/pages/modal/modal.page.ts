import { Component, OnInit } from '@angular/core';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook/ngx';
import { Instagram } from '@ionic-native/instagram/ngx';
import { Router } from "@angular/router"
import { ModalController } from '@ionic/angular';
import { ServerService } from 'src/app/services/server.service';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { ServicedbService } from 'src/app/services/servicedb.service';


@Component({
  selector: 'app-modal',
  templateUrl: './modal.page.html',
  styleUrls: ['./modal.page.scss']
})

/* 
  user authentication with fb and google
*/
export class ModalPage implements OnInit {
  username: string;
  subscriptions$: Array<any> = [];

  constructor(private fb: Facebook,
    private storage: ServicedbService,
    private instagram: Instagram,
    private router: Router,
    private googlePlus: GooglePlus,
    public modalController: ModalController,
    private server: ServerService) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.subscriptions$.forEach(element => {
      element.unsubscribe();
    });
  }

  loginFacebook() {
    this.fb.login(['public_profile', 'email'])
      .then((res: FacebookLoginResponse) => {
        console.log('Logged into Facebook!')
        console.log(res)
        console.log(res.authResponse)
        console.log("secret  = ", res.authResponse.secret)
        console.log("siig  = ", res.authResponse.sig)
        const data = {
          "acesstoken": res.authResponse.accessToken,
          "backend": "facebook",
          "userID": res.authResponse.userID
        }
        this.subscriptions$.push(this.server.exchange_token(data).subscribe(response => {
          this.router.navigate(["/achievements"])
          this.closeModal(response);
        }, error => {
          console.log(error)
        }))
      })
      .catch(e => console.log('Error logging into Facebook', e));
  }

  loginGoogle() {
    this.googlePlus.login({
      'webClientId': "1067392492295-6dfrbbbcqhtqltrcii8aagqpvi8sn9s9.apps.googleusercontent.com",
      'offline': true,
      "scopes": "profile email"
    })
      .then(res => {
        console.log("res = ", JSON.stringify(res))
        const data = {
          "email": res.email,
          "acesstoken": res.accessToken,
          "backend": "google",
          "userID": res.userId,
          "imageurl": res.imageUrl
        }
        this.subscriptions$.push(this.server.exchange_token(data).subscribe(response => {
          this.router.navigate(["/achievements"])
          this.closeModal(response);
        }, error => {
          console.log(error)
        }));
      })
      .catch(err => console.error("error in signin", err));
  }

  closeModal(data: any) {
    if (data) {
      this.storage.setUserDetails(data["data"]["data"]["email"])
      this.storage.setisLoggedIn(true);
    }
    this.modalController.dismiss(data);
  }
}
