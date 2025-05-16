import { Ticker } from "./types";


export const BASE_URL = "ws://localhost:3003"


export class SignalingManager {
    private ws: WebSocket;
    private static instance: SignalingManager;
    private bufferedMessages: any[] = [];
    private callbacks: Map<string, {callback: any, id: string}[]>
    private id: number;
    private initialized: boolean = false;

    // singelton pattern with private constructor for making sure only one object for frontend 
    private constructor() {
        this.ws = new WebSocket(BASE_URL);
        this.bufferedMessages = [];
        this.callbacks = new Map()
        this.id = 1;
        this.init()
    }

    public static getInstance() {
        if(!this.instance) {
            this.instance = new SignalingManager();
        }

        return this.instance;
    }

    init() {
        this.ws.onopen = () => {
            this.initialized = true;
            this.bufferedMessages.forEach(message => {
                this.ws.send(JSON.stringify(message));
            })
            this.bufferedMessages = [];
        }

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data)
            // console.log(message);
            
            const type = message.data.e;
            if (this.callbacks.has(type)) {
                this.callbacks.get(type)?.forEach(({callback} : {callback: any}) => {
                    if (type === "ticker") {
                        const newTicker: Partial<Ticker> = {
                            lastPrice: message.data.c,
                            high: message.data.h,
                            low: message.data.l,
                            volume: message.data.v,
                            quoteVolume: message.data.V,
                            symbol: message.data.s,
                        }
                        console.log(newTicker);
                        callback(newTicker);
                   }
                   if (type === "depth") {
                        const updatedBids = message.data.b;
                        const updatedAsks = message.data.a;
                        const price = message.data.price
                        callback({ bids: updatedBids, asks: updatedAsks, price });
                    }
                })
            }
        }
    }

    sendMessage(message: any) {
        const messageToSend = {
            ...message,
            id: this.id++
        }

        if (!this.initialized) {
            this.bufferedMessages.push(messageToSend);
            return;
        }
        this.ws.send(JSON.stringify(messageToSend))
    }

    async registerCallBack(type: string, callback: any, id: string) {
        this.callbacks.set(type, (this.callbacks.get(type) || []).concat({callback, id}))
    }

    async deregisterCallBack(type: string, id: string) {
        if (this.callbacks.has(type)) {
            const newCallbacks = this.callbacks.get(type)?.filter(callback => callback.id !== id) ?? []
            this.callbacks.set(type, newCallbacks)  
        }
    }
}