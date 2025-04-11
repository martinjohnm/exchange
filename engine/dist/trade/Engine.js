"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Engine = exports.BASE_CURRENCY = void 0;
const RedisManager_1 = require("../RedisManager");
const fromApi_1 = require("../types/fromApi");
const Orderbook_1 = require("./Orderbook");
exports.BASE_CURRENCY = "INR";
class Engine {
    constructor() {
        this.orderbooks = [];
        this.balances = new Map(); // maps userId with Users various currency balances
        this.orderbooks = [new Orderbook_1.Orderbook(`TATA`, [], [], 0, 0)];
        this.setBaseBalances();
    }
    process({ message, clientId }) {
        switch (message.type) {
            case fromApi_1.CREATE_ORDER:
                try {
                    const { executedQty, fills, orderId } = this.createOrder(message.data.market, message.data.price, message.data.quantity, message.data.side, message.data.userId);
                    RedisManager_1.RedisManager.getInstace().sendToApi(clientId, {
                        type: "ORDER_PLACED",
                        payload: {
                            orderId,
                            executedQty,
                            fills
                        }
                    });
                }
                catch (e) {
                    RedisManager_1.RedisManager.getInstace().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId: "",
                            executedQty: 0,
                            fills: 0
                        }
                    });
                }
        }
    }
    createOrder(market, price, quantity, side, userId) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        const baseAsset = market.split("_")[0];
        const quoteAsset = market.split("_")[1];
        console.log(this.orderbooks);
        if (!orderbook) {
            throw new Error("No orderbook found");
        }
        this.checkAndLockFunds(baseAsset, quoteAsset, side, userId, price, quantity);
        const order = {
            price: Number(price),
            quantity: Number(quantity),
            orderId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            filled: 0,
            side,
            userId
        };
        const { fills, executedQty } = orderbook.addOrder(order);
        return {
            executedQty,
            fills,
            orderId: order.orderId
        };
    }
    checkAndLockFunds(baseAsset, quoteAsset, side, userId, price, quantity) {
        var _a, _b;
        if (side === "buy") {
            // quote asset is inr 
            if ((((_a = this.balances.get(userId)) === null || _a === void 0 ? void 0 : _a[quoteAsset].available) || 0) < Number(quantity) * Number(price)) {
                throw new Error("Insufficient funds");
            }
            //@ts-ignore
            this.balances.get(userId)[quoteAsset].available = this.balances.get(userId)[quoteAsset].available - (Number(quantity) * Number(price));
            //@ts-ignore
            this.balances.get(userId)[quoteAsset].locked = this.balances.get(userId)[quoteAsset].locked + (Number(quantity) * Number(price));
        }
        else {
            if ((((_b = this.balances.get(userId)) === null || _b === void 0 ? void 0 : _b[baseAsset].available) || 0) < Number(quantity) * Number(price)) {
                throw new Error("Insufficient funds");
            }
            //@ts-ignore
            this.balances.get(userId)[baseAsset].available = this.balances.get(userId)[baseAsset].available - (Number(quantity) * Number(price));
            //@ts-ignore
            this.balances.get(userId)[baseAsset].locked = this.balances.get(userId)[baseAsset].locked + (Number(quantity) * Number(price));
        }
    }
    setBaseBalances() {
        this.balances.set("1", {
            [exports.BASE_CURRENCY]: {
                available: 10000000,
                locked: 0
            },
            "TATA": {
                available: 10000000,
                locked: 0
            }
        });
        this.balances.set("2", {
            [exports.BASE_CURRENCY]: {
                available: 10000000,
                locked: 0
            },
            "TATA": {
                available: 10000000,
                locked: 0
            }
        });
        this.balances.set("5", {
            [exports.BASE_CURRENCY]: {
                available: 10000000,
                locked: 0
            },
            "TATA": {
                available: 10000000,
                locked: 0
            }
        });
    }
}
exports.Engine = Engine;
