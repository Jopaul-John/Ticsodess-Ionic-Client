import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-invitation',
  templateUrl: './invitation.page.html',
  styleUrls: ['./invitation.page.scss'],
})

/* 
  Dsiplays the invitation message everywhere unless user is busy
*/
export class InvitationPage implements OnInit {

  constructor(private modalController: ModalController) { }
  @Input() sender: string;
  @Input() gameType: string;
  isAccept: boolean = false;
  countTimer: number = 10;
  countInterval :any;
  ngOnInit() {
    this.countInterval = setInterval(() => {
      if (this.countTimer == 1) {
        clearInterval(this.countInterval);
        this.decline();
      }
      this.countTimer -= 1;
    }, 1000)
  }

  accept() {
    clearInterval(this.countInterval);
    this.isAccept = true
    this.modalController.dismiss(this.isAccept);
  }

  decline() {
    clearInterval(this.countInterval);
    this.modalController.dismiss(this.isAccept);
  }

}
