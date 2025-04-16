import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { CancelOrderMessageToEngine, CreateOrderMessageToEngine, GetOpenOrdersMessageToEngine } from "../types/to";
import { CANCEL_ORDER, CREATE_ORDER, GET_OPEN_ORDERS, OpenOrdersMessageFromOrderBook, OrderCancelledMessageFromOrderBook, OrderPlacedMessageFromOrderBook } from "../types";

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
    return
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
    res.json(response.payload)
})
orderRouter.get("/open", async (req, res) => {
    const response = await RedisManager.getInstance().sendAndAwait<GetOpenOrdersMessageToEngine, OpenOrdersMessageFromOrderBook>({
        type: GET_OPEN_ORDERS,
        data: {
            userId: req.query.userId as string,
            market: req.query.market as string
        }
    });
    res.json(response.payload);
});