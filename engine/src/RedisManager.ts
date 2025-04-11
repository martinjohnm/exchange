import { RedisClientType, createClient } from "redis";




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

    public publishMessage(channel:string, message: any) {
        this.client.publish(channel, JSON.stringify(message))
    }
    public sendToApi(clientId: string, message: any) {
        this.client.publish(clientId, JSON.stringify(message))
    }
}