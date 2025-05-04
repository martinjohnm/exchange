
import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { GET_DEPTH, GET_TICKER } from "../types";

export const tickersRouter = Router();

tickersRouter.get("/", async (req, res) => {    
    const { symbol } = req.query;
    const response = await RedisManager.getInstance().sendAndAwait({
        type: GET_TICKER,
        data: {
            market: symbol as string
        }
    });
    res.json(response);
});