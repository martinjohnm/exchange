import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { CANCEL_ORDER, CREATE_ORDER, OrderCancelledMessageFromOrderBook, OrderPlacedMessageFromOrderBook } from "../types";
import { CancelOrderMessageToEngine, CreateOrderMessageToEngine } from "../types/to";

export const orderRouter = Router()

orderRouter.post("/", async (req, res) => {
    const { market, price, quantity, side, userId } = req.body;
    console.log({ market, price, quantity, side, userId });
    const response = await RedisManager.getInstance().sendAndAwait<CreateOrderMessageToEngine, OrderPlacedMessageFromOrderBook>({
        type: CREATE_ORDER,
        data: {
            market,
            price,
            quantity,
            side,
            userId
        }
    })
    res.json(response.payload)
    
})

orderRouter.delete("/", async (req, res) => {
    const { orderId, market } = req.body;
    const response = await RedisManager.getInstance().sendAndAwait<CancelOrderMessageToEngine, OrderCancelledMessageFromOrderBook>({
        type: CANCEL_ORDER,
        data: {
            orderId,
            market
        }
    })
    
})