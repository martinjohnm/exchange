
import { RedisClientType, createClient } from "redis"

export class RedisManager {
    private client: RedisClientType
    private publisher: RedisClientType
    private static instance: RedisManager
    

    private constructor() {
        this.client = createClient()
        this.client.connect()
        this.publisher = createClient()
        this.publisher.connect()
    }

    public static getInstance(): RedisManager {
        if (!RedisManager.instance) {
            RedisManager.instance = new RedisManager()
        }
        return RedisManager.instance
    }

    public sendAndAwait<MessageToEngineType, MessageFromEngineType>(message : MessageToEngineType) {
        
        return new Promise<MessageFromEngineType>((resolve) => {
            const id = this.getRandomClientId()
            this.client.subscribe(id, (messageFromPublisher) => {
                this.client.unsubscribe(id)
                resolve(JSON.parse(messageFromPublisher))
            })
            this.publisher.lPush("messages", JSON.stringify({ clientId : id, message }))
        })

    }


    public getRandomClientId() {
        return Math.random().toString(36).substring(2,15) + Math.random().toString(36).substring(2,15)
    }
}