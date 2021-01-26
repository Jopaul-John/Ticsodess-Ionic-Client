import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-instructions',
  templateUrl: './instructions.component.html',
  styleUrls: ['./instructions.component.scss'],
})

/* 
  Shows a small instruction set to aware users to play the game
*/
export class InstructionsComponent implements OnInit {

  slideOpts = {
    initialSlide: 0,
    speed: 300,
    autoplay: {
      delay: 4000,
      stopOnLastSlide: true
    },
  };
  constructor() { }

  ngOnInit() {}

}
