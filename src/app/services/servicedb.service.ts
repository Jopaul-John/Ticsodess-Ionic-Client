import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';


@Injectable({
  providedIn: 'root'
})

/* 
  connects with local storage
  in web page user should not reload a view else data will be lost
*/
export class ServicedbService {
  gameType: string;
  userName: string;
  playerType: string;
  username: string;
  email: string;
  tempEmail: string;
  token: string;
  roomName: string;
  isPlayingFirst: string;
  showAd: boolean;
  userstats: any;
  isBusy: boolean;
  isStatsUpdated: boolean = false;
  gameTitle: string;
  opponentName: string;

  constructor(private storage: Storage) { }

  setUserDetails(email: string) {
    this.storage.set("email", email)
  }

  getUserDetails() {
    return this.storage.get("email")
  }

  setUserID(id: string) {
    this.storage.set("id", String(id))
  }

  getUserID() {
    return this.storage.get("id")
  }

  setToken(token: string) {
    this.storage.set("token", token)
  }

  getToken() {
    return this.storage.get("token")
  }

  setUserName(userName: string) {
    this.storage.set("username", userName);
  }

  getUserName() {
    return this.storage.get("username")
  }

  setisLoggedIn(isLoggedIn: boolean) {
    this.storage.set("isLoggedIn", String(isLoggedIn));
  }

  getisLoggedIn() {
    return this.storage.get("isLoggedIn")
  }

  setRemainingHints(hints: number) {
    this.storage.set("hints", hints)
  }

  getRemainingHints() {
    return this.storage.get("hints")
  }

  setServiceToken(token: string) {
    this.token = token;
  }
  getServiceToken() {
    return this.token
  }

  setFirstPlayer(isPlayingFirst: string) {
    this.isPlayingFirst = isPlayingFirst;
  }

  getFirstPlayer() {
    return this.isPlayingFirst;
  }

  setGameType(gameType: string) {
    this.gameType = gameType;
  }

  getGameType() {
    return this.gameType;
  }

  setPlayerType(playerType: string) {
    this.playerType = playerType;
  }

  getPlayerType() {
    return this.playerType;
  }

  setGameRoom(roomName: string) {
    this.roomName = roomName;
  }

  getGameRoom() {
    return this.roomName;
  }

  setuserStats(object: any) {
    this.userstats = object;
  }
  getUserStats() {
    return this.userstats;
  }
  setisUserBusy(status: boolean) {
    this.isBusy = status;
  }
  getisUserBusy() {
    return this.isBusy;
  }

  setIsStatsUpdated(status: boolean) {
    this.isStatsUpdated = status
  }
  getIsStatsUpdated() {
    return this.isStatsUpdated
  }
  setGameTitle(name: string) {
    this.gameTitle = name;
  }
  getGameTitle() {
    return this.gameTitle;
  }
  setOpponentName(opponentName:string) {
    this.opponentName = opponentName;
  }
  getOpponentName() {
    return this.opponentName;
  }
  setGameStatus(isExited:boolean) {
    this.storage.set("isexited", isExited)
  }
  getGameStatus() {
    return this.storage.get("isexited")
  }
}
