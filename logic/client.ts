import { Socket } from "net";

export class Client {
    public socket: Socket
    constructor(socket: Socket) {
        this.socket = socket
    }

    public output(text: string): void {
        console.log(`[${this.socket.remoteAddress}] ==> ${text}`)
    }
}