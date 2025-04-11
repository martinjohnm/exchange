import { RedisManager } from "../RedisManager"
import { OrderPlacedMessageFromOrderBook } from "../types/fromApi"



export class Engine {


    private orderbooks: any[] = []
    private balances: Map<string, any> = new Map()

    constructor() {

    }

    process ({ message, clientId }: {message: OrderPlacedMessageFromOrderBook, clientId: string}) {
        RedisManager.getInstace().sendToApi(clientId, {

        })
    }
}