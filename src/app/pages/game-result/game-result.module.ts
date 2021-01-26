import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GameResultPageRoutingModule } from './game-result-routing.module';

import { GameResultPage } from './game-result.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GameResultPageRoutingModule
  ],
  declarations: [GameResultPage]
})
export class GameResultPageModule {}
