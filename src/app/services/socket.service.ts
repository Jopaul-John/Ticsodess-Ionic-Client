import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})

/* 
  rxjs socket
  connects to web socket
*/
export class SocketService {

  hostName: string = location.protocol === "https:" ? "wss:" : "ws:" + "//192.168.10.44:8000/ws/";
  subject: any;

  constructor() { }

  connect(url: string) {
    this.subject = webSocket(this.hostName + url);
    return this.subject;
  }

  send(message: any): void {
    this.subject.subscribe();
    this.subject.next(message);
  }

  terminate() {
    this.subject.complete();
  }

  private handleError(error: any, caught: any): any {
    console.log(error, caught);
  }

}
