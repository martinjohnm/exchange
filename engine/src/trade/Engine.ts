import { RedisManager } from "../RedisManager"
import { AllMessages, ORDER_UPDATE, TRADE_ADDED } from "../types";
import { CANCEL_ORDER, CREATE_ORDER, CreateOrderMessageFromApi, GET_DEPTH, GET_OPEN_ORDERS, GET_TICKER, MessageTypeToENgine, OrderType } from "../types/fromApi";
import { Fill, Order, Orderbook } from "./Orderbook"
import { v4 as uuidv4 } from 'uuid';

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

    process ({ message, clientId }: {message: any, clientId: string}) {
        
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

                    if (!cancelOrderBook) {
                        throw new Error("No orderbook found")
                    }

                    // console.log(orderId);
                    

                    const order = cancelOrderBook.asks.find(o => o.orderId === orderId) || cancelOrderBook.bids.find(o => o.orderId === orderId)
                    // console.log(order);
                    
                    if (!order) {
                        console.log("No order found");
                        throw new Error("No order found")    
                    }

                    if (order.side === "buy") {
                        const price = cancelOrderBook.cancelBid(order)
                        const leftQuantity = (order.quantity - order.filled) * order.price
                        //@ts-ignore
                        this.balances.get(order.userId)[cancelOrderBook.quoteAsset].available += leftQuantity
                        //@ts-ignore
                        this.balances.get(order.userId)[cancelOrderBook.quoteAsset].locked -= leftQuantity
                        if (price) {

                        }
                    } else {
                        const price = cancelOrderBook.cancelAsk(order);
                        const leftQuantity = (order.quantity - order.filled) * order.price;
                        //@ts-ignore
                        this.balances.get(order.userId)[cancelOrderBook.baseAsset].available += leftQuantity;
                        //@ts-ignore
                        this.balances.get(order.userId)[cancelOrderBook.baseAsset].locked -= leftQuantity;
                        if (price) {

                        }
                    }

      
                    
                    RedisManager.getInstace().sendToApi(clientId, {
                        type : "ORDER_CANCELLED",
                        payload: {
                            orderId,
                            executedQty: 0,
                            remainingQty: 0
                        }
                    })

                } catch(e) {
                    console.log("Error while cancelling order", );
                    //console.log(e);
                }
                break;
            
            case GET_DEPTH:
                try {
                    const market = message.data.market;
                    const orderbook = this.orderbooks.find(o => o.ticker() === market)
                    if (!orderbook) {
                        throw new Error('No orderbook found')
                    }

                    RedisManager.getInstace().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: orderbook.getDepth()
                    })
                } catch(e) {
                    console.log(e);
                    RedisManager.getInstace().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: {
                            bids: [],
                            price: "0",
                            asks: []
                        }
                    });
                }
                break;

            case GET_TICKER:
            try {
                const market = message.data.market;
                const orderbook = this.orderbooks.find(o => o.ticker() === market)
                if (!orderbook) {
                    throw new Error('No orderbook found')
                }

                RedisManager.getInstace().sendToApi(clientId, {
                    type: "DEPTH",
                    payload: orderbook.getDepth()
                })
            } catch(e) {
                console.log(e);
                RedisManager.getInstace().sendToApi(clientId, {
                    type: "DEPTH",
                    payload: {
                        bids: [],
                        asks: []
                    }
                });
            }

            case GET_OPEN_ORDERS:
            try {
                const market = message.data.market;
                const orderbook = this.orderbooks.find(o => o.ticker() === market)
                if (!orderbook) {
                    throw new Error('No orderbook found')
                }

                const openOrders = orderbook.getOpenOrders(message.data.userId)

                RedisManager.getInstace().sendToApi(clientId, {
                    type: "OPEN_ORDERS",
                    payload: openOrders
                }); 
            } catch(e) {
                console.log(e);
                RedisManager.getInstace().sendToApi(clientId, {
                    type: "DEPTH",
                    payload: {
                        bids: [],
                        asks: []
                    }
                });
            }
            break;
        }
    }

    addOrderBook(orderbook: Orderbook) {
        this.orderbooks.push(orderbook)
    }

    createOrder (market: string, price: string, quantity: string, side: "buy" | "sell", userId: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market)
        const baseAsset = market.split("_")[0]
        const quoteAsset = market.split("_")[1]

   
        if (!orderbook){
            throw new Error("No orderbook found")
        }

        this.checkAndLockFunds(baseAsset, quoteAsset, side, userId,  price, quantity)

 

        const order: Order = {
            price : Number(price),
            quantity : Number(quantity),
            orderId : uuidv4(),
            filled : 0,
            side,
            userId
        }

        const { fills, executedQty } = orderbook.addOrder(order)
        this.updateBalance(userId, baseAsset, quoteAsset, side, fills, executedQty, order.price);
        this.publisWsDepthUpdates(market)
        this.createDbTrades(fills, market, userId);
        this.updateDbOrders(order, executedQty, fills, market);
       
 
 
        return {
            executedQty, 
            fills, 
            orderId : order.orderId
        }
    }

    publishWsTrades(fills: Fill[], userId: string, market: string) {
        fills.forEach(fill => {
            RedisManager.getInstace().publishMessage(`trade@${market}`, {
                stream: `trade@${market}`,
                data: {
                    e: "trade",
                    t: fill.tradeId,
                    m: fill.otherUserId === userId , // need to check
                    p: fill.price,
                    q: fill.qty.toString(),
                    s: market
                }
            })
        })
    }


    publisWsDepthUpdates(market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if (!orderbook) {
            return;
        }
        const depth = orderbook.getDepth();
        console.log(orderbook.getCandles());
        

        RedisManager.getInstace().publishMessage(`depth@${market}`, {
            stream: `depth@${market}`,
            data: {
                a: depth.asks,
                b: depth.bids,
                e: "depth",
                price: depth.price
            }
        });
    
    }
    createDbTrades(fills: Fill[], market: string, userId: string) {
        fills.forEach(fill => {
            RedisManager.getInstace().pushMessageToDb({
                type: TRADE_ADDED,
                data: {
                    market: market,
                    id: fill.tradeId.toString(),
                    isBuyerMaker: fill.otherUserId === userId, // TODO: Is this right?
                    price: fill.price,
                    quantity: fill.qty.toString(),
                    quoteQuantity: (fill.qty * Number(fill.price)).toString(),
                    timestamp : fill.timestamp
                }
            });
        });
    }
    updateDbOrders(order: Order, executedQty: number, fills: Fill[], market: string) {
        RedisManager.getInstace().pushMessageToDb({
            type: ORDER_UPDATE,
            data: {
                orderId: order.orderId,
                executedQty: executedQty,
                market: market,
                price: order.price.toString(),
                quantity: order.quantity.toString(),
                side: order.side,
            }
        });

        fills.forEach(fill => {
            
            RedisManager.getInstace().pushMessageToDb({
                type: ORDER_UPDATE,
                data: {
                    orderId: fill.markerOrderId,
                    executedQty: fill.qty
                }
            });
        });
    }

    sendUpdatedDepthAt(price: string, market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if (!orderbook) {
            return;
        }
        const depth = orderbook.getDepth();

        RedisManager.getInstace().publishMessage(`depth@${market}`, {
            stream: `depth@${market}`,
            data: {
                a: depth.asks,
                b: depth.bids,
                e: "depth"
            }
        });
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

    updateBalance(userId: string, baseAsset: string, quoteAsset: string, side: "buy"|"sell", fills: Fill[], executedQty: number, orderPrice : number) {
        
        if (side === "buy") {
            fills.forEach(fill => {
                // Update quote asset balance
          
                //@ts-ignore
                

                // Note: fill.price is the price of the asset from the orderbooks bids which may or may not be equal to the buying price
                // but we always need to substract the price from the otherusers baseasset locked balance

                this.balances.get(fill.otherUserId)[quoteAsset].available = this.balances.get(fill.otherUserId)?.[quoteAsset].available + (Number(fill.qty) * Number(fill.price));

                // user (one who bought the second and also userId) may or may not have some profit because the order could match at lower price
                //@ts-ignore
                this.balances.get(userId)[quoteAsset].locked = this.balances.get(userId)?.[quoteAsset].locked - (Number(fill.qty) * Number(orderPrice));
                //@ts-ignore
                this.balances.get(userId)[quoteAsset].available = this.balances.get(userId)?.[quoteAsset].available + (Number(fill.qty) * (Number(orderPrice) - Number(fill.price)));

                // Update base asset balance

                //@ts-ignore
                this.balances.get(fill.otherUserId)[baseAsset].locked = this.balances.get(fill.otherUserId)?.[baseAsset].locked - (Number(fill.qty)*Number(fill.price));

                //@ts-ignore
                this.balances.get(userId)[baseAsset].available = this.balances.get(userId)?.[baseAsset].available + (Number(fill.qty)*Number(fill.price));
            });
            
        } else {
            
            fills.forEach(fill => {
                // Update quote asset balance

                // Note: fill.price is the price of the asset from the orderbooks bids which may or may not be equal to the selling price
                // but we always need to substract the current order price from the users baseasset

                //@ts-ignore
                    
                this.balances.get(fill.otherUserId)[quoteAsset].locked = this.balances.get(fill.otherUserId)?.[quoteAsset].locked - (Number(fill.qty) * Number(fill.price));

                //@ts-ignore
                this.balances.get(userId)[quoteAsset].available = this.balances.get(userId)?.[quoteAsset].available + (Number(fill.qty) * Number(orderPrice));

                // Update base asset balance

                //@ts-ignore
                this.balances.get(fill.otherUserId)[baseAsset].available = this.balances.get(fill.otherUserId)?.[baseAsset].available + (Number(fill.qty) * Number(fill.price));

                //@ts-ignore
                this.balances.get(userId)[baseAsset].locked = this.balances.get(userId)?.[baseAsset].locked - (Number(fill.qty) * Number(orderPrice));
                //@ts-ignore
                this.balances.get(userId)[baseAsset].available = this.balances.get(userId)?.[baseAsset].available - (Number(fill.qty) * (Number(fill.price) - Number(orderPrice)));

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