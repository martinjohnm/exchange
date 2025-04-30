import WebSocket from "ws";
import { OutgoingMessage } from "./types/out";
import { IncomingMessage, SUBSCRIBE, UNSUBSCRIBE } from "./types/in";
import { SubscriptionManager } from "./SubscriptionManager";




export class User {

    private id : string;
    private ws : WebSocket

    constructor (id : string, ws : WebSocket) {
        this.id = id;
        this.ws = ws;
        this.addListeners()
    }

    emit (messsage : OutgoingMessage) {
        this.ws.send(JSON.stringify(messsage))
    }

    private addListeners() {
        this.ws.on("message", (message: string) => {
            const parsedMessage: IncomingMessage = JSON.parse(message)
            if (parsedMessage.method === SUBSCRIBE) {
                parsedMessage.params.forEach(s => SubscriptionManager.getInstance().subscribe(this.id, s));
            }

            if (parsedMessage.method === UNSUBSCRIBE) {
                parsedMessage.params.forEach(s => SubscriptionManager.getInstance().unsubscribe(this.id, s))
            }
        })
    }

}