import { RedisClientType, createClient } from "redis";
import { ORDER_UPDATE, TRADE_ADDED } from "./types";



type DbMessage = {
    type: typeof TRADE_ADDED,
    data: {
        id: string,
        isBuyerMaker: boolean,
        price: string,
        quantity: string,
        quoteQuantity: string,
        timestamp: number,
        market: string
    }
} | {
    type: typeof ORDER_UPDATE,
    data: {
        orderId: string,
        executedQty: number,
        market?: string,
        price?: string,
        quantity?: string,
        side?: "buy" | "sell",
    }
}

export class RedisManager {
    private client: RedisClientType
    private static instance: RedisManager

    constructor() {
        this.client = createClient()
        this.client.connect()
    }

    public static getInstace(): RedisManager {
        if (!this.instance) {
            this.instance = new RedisManager()
        }

        return this.instance
    }

    public pushMessageToDb(message: DbMessage) {
        console.log(message);
        
        this.client.lPush("db_processor", JSON.stringify(message))
    }

    public publishMessage(channel:string, message: any) {
        this.client.publish(channel, JSON.stringify(message))
    }
    public sendToApi(clientId: string, message: any) {
        this.client.publish(clientId, JSON.stringify(message))
    }
}