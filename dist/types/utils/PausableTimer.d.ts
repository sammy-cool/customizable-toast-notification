export class PausableTimer {
    constructor(callback: any, delay: any);
    callback: any;
    delay: any;
    remaining: any;
    startTime: number;
    timeoutId: any;
    isPaused: boolean;
    isCompleted: boolean;
    start(): this;
    pause(): this;
    resume(): this;
    clear(): this;
    getRemainingTime(): any;
}
