import { Observable, Subject } from 'rxjs';

/* 
    timer class to count the remaining time
*/
export class Timer {
    totalTime: number;
    timer: any;
    isTimeOver: boolean;
    private timeOverSubject = new Subject<boolean>();

    constructor(totalSeconds: number) { 
        this.totalTime = totalSeconds;
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.totalTime -= 1;
            if (this.totalTime == 0) {
                this.pauseTimer();
                this.timeOverSubject.next(this.isTimeOver);
                this.isTimeOver = true;
            }
        }, 1000)
    }

    pauseTimer() {
        console.log("pausing timer");
        clearInterval(this.timer);
    }
    isTimeOverSubject(): Observable<any> {
        return this.timeOverSubject.asObservable();
    }
}