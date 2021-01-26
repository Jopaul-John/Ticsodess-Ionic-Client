import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { OnlinePlayerComponent } from './online-player/online-player.component';
import { AchievementsComponent } from './achievements/achievements.component';
import { InstructionsComponent } from './instructions/instructions.component';
import { GameComponent } from './game/game.component'
import { AppComponent } from './app.component';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    // redirectTo: 'home',
    pathMatch: 'full',
    component: AppComponent
  },
  {
    path: "online",
    component: OnlinePlayerComponent
  },
  {
    path: "instructions",
    component: InstructionsComponent
  },
  {
    path: "achievements",
    component: AchievementsComponent
  },
  {
    path: "startgame",
    component: GameComponent
  },
  {
    path: 'modal',
    loadChildren: () => import('./pages/modal/modal.module').then( m => m.ModalPageModule)
  },
  {
    path: 'game-result',
    loadChildren: () => import('./pages/game-result/game-result.module').then( m => m.GameResultPageModule)
  },
  {
    path: 'invitation',
    loadChildren: () => import('./pages/invitation/invitation.module').then( m => m.InvitationPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
