import { RedisManager } from "../RedisManager"
import { AllMessages } from "../types";
import { CANCEL_ORDER, CREATE_ORDER, CreateOrderMessageFromApi, MessageTypeToENgine } from "../types/fromApi";
import { Fill, Order, Orderbook } from "./Orderbook"

export const BASE_CURRENCY = "INR";


interface UserBalance {
    // index signuture
    [key: string]: {
        available: number;
        locked : number
    }
}

export class Engine {


    private orderbooks: Orderbook[] = []
    private balances: Map<string, UserBalance> = new Map() // maps userId with Users various currency balances

    constructor() {
        this.orderbooks = [new Orderbook(`TATA`, [],[],0,0)];
        this.setBaseBalances()
    }

    process ({ message, clientId }: {message: MessageTypeToENgine, clientId: string}) {
        
        switch (message.type) {
            case CREATE_ORDER:
                try {

       
                    const { executedQty, fills, orderId } = this.createOrder(message.data.market, message.data.price, message.data.quantity, message.data.side, message.data.userId)
                    RedisManager.getInstace().sendToApi(clientId, {
                        type: "ORDER_PLACED",
                        payload : {
                            orderId, 
                            executedQty, 
                            fills
                        }
                    })

       
                } catch(e) {
                    console.log(e);
                    
                    RedisManager.getInstace().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: {
                            orderId : "",
                            executedQty : 0, 
                            fills : 0
                        }
                    })
                }
                break;
            case CANCEL_ORDER:
                try {

                    const orderId = message.data.orderId
                    const cancelMarket = message.data.market
                    const cancelOrderBook = this.orderbooks.find(o => o.ticker() === cancelMarket)
                    const quoteAsset = cancelMarket.split("_")[1]

                    if (!cancelOrderBook) {
                        throw new Error("No orderbook found")
                    }

                    console.log(orderId);
                    

                    const order = cancelOrderBook.asks.find(o => o.orderId === orderId) || cancelOrderBook.bids.find(o => o.orderId === orderId)
                    console.log(order);
                    
                    if (!order) {
                        console.log("No order found");
                        throw new Error("No order found")    
                    }

                    if (order.side === "buy") {
                        const price = cancelOrderBook.cancelBid(order)
                        const leftQuantity = (order.quantity - order.filled) * order.price
                        //@ts-ignore
                        this.balances.get(order.userId)[BASE_CURRENCY].available += leftQuantity
                        //@ts-ignore
                        this.balances.get(order.userId)[BASE_CURRENCY].locked -= leftQuantity
                        if (price) {

                        }
                    } else {
                        const price = cancelOrderBook.cancelAsk(order);
                        const leftQuantity = order.quantity - order.filled;
                        //@ts-ignore
                        this.balances.get(order.userId)[quoteAsset].available += leftQuantity;
                        //@ts-ignore
                        this.balances.get(order.userId)[quoteAsset].locked -= leftQuantity;
                        if (price) {

                        }
                    }

                    console.log(this.orderbooks);
                    
                    RedisManager.getInstace().sendToApi(clientId, {
                        type : "ORDER_CANCELLED",
                        payload: {
                            orderId,
                            executedQty: 0,
                            remainingQty: 0
                        }
                    })

                } catch(e) {
                    console.log("Error hwile cancelling order", );
                    console.log(e);
                }
                break;
            
        }
    }

    createOrder (market: string, price: string, quantity: string, side: "buy" | "sell", userId: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market)
        const baseAsset = market.split("_")[0]
        const quoteAsset = market.split("_")[1]

   
        if (!orderbook){
            throw new Error("No orderbook found")
        }

        this.checkAndLockFunds(baseAsset, quoteAsset, side, userId,  price, quantity)

        console.log("balance book during trade", this.balances);
        

        const order: Order = {
            price : Number(price),
            quantity : Number(quantity),
            orderId : Math.random().toString(36).substring(2,15) + Math.random().toString(36).substring(2,15),
            filled : 0,
            side,
            userId
        }

        const { fills, executedQty } = orderbook.addOrder(order)
        
        
        this.updateBalance(userId, baseAsset, quoteAsset, side, fills, executedQty);
        
        console.log("balance book after trade", this.balances);

        console.log(this.orderbooks);
        
 
        return {
            executedQty, 
            fills, 
            orderId : order.orderId
        }
    }

    checkAndLockFunds(baseAsset: string, quoteAsset: string, side: "buy"|"sell", userId: string, price: string, quantity: string) {
   
        if (side === "buy") {
            if ((this.balances.get(userId)?.[quoteAsset]?.available || 0) < Number(quantity) * Number(price)) {
                throw new Error("Insufficient funds");
            }
            //@ts-ignore
            this.balances.get(userId)[quoteAsset].available = this.balances.get(userId)?.[quoteAsset].available - (Number(quantity) * Number(price));
            
            //@ts-ignore
            this.balances.get(userId)[quoteAsset].locked = this.balances.get(userId)?.[quoteAsset].locked + (Number(quantity) * Number(price));
        } else {
            if ((this.balances.get(userId)?.[baseAsset]?.available || 0) < Number(quantity) * Number(price)) {
                throw new Error("Insufficient funds");
            }
            //@ts-ignore
            this.balances.get(userId)[baseAsset].available = this.balances.get(userId)?.[baseAsset].available - (Number(quantity) * Number(price));
            
            //@ts-ignore
            this.balances.get(userId)[baseAsset].locked = this.balances.get(userId)?.[baseAsset].locked + (Number(quantity) * Number(price));
        }
    }

    updateBalance(userId: string, baseAsset: string, quoteAsset: string, side: "buy"|"sell", fills: Fill[], executedQty: number) {
        if (side === "buy") {
            fills.forEach(fill => {
                // Update quote asset balance
          
                //@ts-ignore
                
                this.balances.get(fill.otherUserId)[quoteAsset].available = this.balances.get(fill.otherUserId)?.[quoteAsset].available + (fill.qty * fill.price);

                //@ts-ignore
                this.balances.get(userId)[quoteAsset].locked = this.balances.get(userId)?.[quoteAsset].locked - (fill.qty * fill.price);

                // Update base asset balance

                //@ts-ignore
                this.balances.get(fill.otherUserId)[baseAsset].locked = this.balances.get(fill.otherUserId)?.[baseAsset].locked - fill.qty*fill.price;

                //@ts-ignore
                this.balances.get(userId)[baseAsset].available = this.balances.get(userId)?.[baseAsset].available + fill.qty*fill.price;

            });
            
        } else {
            console.log(fills);
            
            fills.forEach(fill => {
                // Update quote asset balance
        
                //@ts-ignore
                    
                this.balances.get(fill.otherUserId)[quoteAsset].locked = this.balances.get(fill.otherUserId)?.[quoteAsset].locked - (fill.qty * fill.price);

                //@ts-ignore
                this.balances.get(userId)[quoteAsset].available = this.balances.get(userId)?.[quoteAsset].available + (fill.qty * fill.price);

                // Update base asset balance

                //@ts-ignore
                this.balances.get(fill.otherUserId)[baseAsset].available = this.balances.get(fill.otherUserId)?.[baseAsset].available + (fill.qty * fill.price);

                //@ts-ignore
                this.balances.get(userId)[baseAsset].locked = this.balances.get(userId)?.[baseAsset].locked - (fill.qty * fill.price);

            });
        }
    }

    setBaseBalances() {
        this.balances.set("1", {
            [BASE_CURRENCY]: {
                available : 10000000,
                locked: 0
            }, 
            "TATA": {
                available: 10000000,
                locked:0
            }
        })
        this.balances.set("2", {
            [BASE_CURRENCY]: {
                available : 10000000,
                locked: 0
            }, 
            "TATA": {
                available: 10000000,
                locked:0
            }
        })
        this.balances.set("5", {
            [BASE_CURRENCY]: {
                available : 10000000,
                locked: 0
            }, 
            "TATA": {
                available: 10000000,
                locked:0
            }
        })
    }
}