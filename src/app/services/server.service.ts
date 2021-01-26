import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ServicedbService } from './servicedb.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

/* 
  setsup with server
  class different endpoints
*/
export class ServerService {

  // hostName: string = "https://whispering-savannah-20805.herokuapp.com";
  hostName:string = "http://192.168.10.44:8000"
  constructor(private _http: HttpClient,
    private storage: ServicedbService) { }

  getAIMove(board: any, boardList: any, marker: number, lastMove: number) {
    let params = new HttpParams().set("board", String(board)).
      set("boardList", String(boardList)).
      set("lastMove", String(lastMove)).
      set("marker", String(marker))
    return this._http.get(this.hostName + "/ticsodess/aimove/", { params: params });
  }

  createTemporaryUser() {
    return this._http.post(this.hostName + "/ticsodess/tempusercreate/", {
      "ipaddress": String(location.host) + (Math.random() * 100) + 1
    });
  }

  findFreeRoom(userName: string, isFriend: boolean) {
    return this._http.post(this.hostName + "/ticsodess/freeroom/", {
      "username": userName,
      "isfriend": isFriend
    });
  }

  checkRoomIsFull(roomName: string) {
    let params = new HttpParams().set("gameRoom", roomName)
    return this._http.get(this.hostName + "/ticsodess/freeroom/", { params: params });
  }

  confirmSecondPlayerasBot(roomName: string) {
    return this._http.post(this.hostName + "/ticsodess/room/", {
      "gameRoom": roomName,
    });
  }

  getRecentFriends(userMail: string) {
    let params = new HttpParams().set("userMail", userMail)
    return this._http.get(this.hostName + "/ticsodess/recentfriends/", { params: params });
  }

  getSerachFriend(userMail: string) {
    let params = new HttpParams().set("userMail", userMail)
    return this._http.get(this.hostName + "/ticsodess/searchfriend/", { params: params });
  }

  getFriendRoom(userMail: string) {
    let params = new HttpParams().set("userMail", userMail)
    return this._http.get(this.hostName + "/ticsodess/friendroom/", { params: params });
  }

  joinRoom(roomName: string, userName: string) {
    let params = new HttpParams().set("roomName", roomName).set("username", userName)
    return this._http.get(this.hostName + "/ticsodess/joinroom/", { params: params });
  }

  getUserDetails() {
    return this._http.get(this.hostName + "/ticsodess/userDetails/");
  }

  setBusyStats(isbusy:boolean) {
    let params = new HttpParams().set("isbusy", String(isbusy))
    return this._http.get(this.hostName + "/ticsodess/busy", {params:params})
  }

  exchange_token(data: any) {
    return this._http.post(this.hostName + "/ticsodess/sociallogin/", data)
  }

  updateUserName(username: string) {
    return this._http.post(this.hostName + "/ticsodess/updateusername/", {
      "username": username
    })
  }

  updateStats(data:any) {
    return this._http.post(this.hostName + "/ticsodess/stats/", {
      "points": data.points,
      "isWin" : String(data.isWin),
      "isDraw": String(data.isDraw)
    });
  }

  getShareImage(data:any) {
    return this._http.post(this.hostName + "/shareimage/", {
      "Username" : data.userName,
      "level": data.level
    });
  }
}
