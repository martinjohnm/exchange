

export const BASE_URL = "ws://localhost:3001"


export class SignalingManager {
    private ws: WebSocket;
    private static instance: SignalingManager;
    private bufferedMessages: any[] = [];
    private callbacks: any = {}
    private id: number;
    private initialized: boolean = false;

    constructor() {
        this.ws = new WebSocket(BASE_URL);
        this.bufferedMessages = [];
        this.id = 1;

    }

    public static getInstance() {
        if(!this.instance) {
            this.instance = new SignalingManager();
        }

        return this.instance;
    }
}