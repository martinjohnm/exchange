import { TimeFrame } from "../types";
import { getHourKey, getMinuteKey, getTimeKey, getWeekKey } from "../utils/time";
import { BASE_CURRENCY } from "./Engine";


export interface Order {
    price : number;
    quantity : number;
    orderId : string;
    filled : number;
    side : "buy" | "sell";
    userId : string
}


export interface Fill {
    price: string;
    qty: number;
    tradeId: number;
    otherUserId: string;
    markerOrderId: string;
    timestamp : number
}

export interface Candle {
    open?: number,
    high?: number, 
    low?: number, 
    close?: number, 
    current? : number,
    volume?: number,
    timestamp?: string
}

export enum CandleTypes {
    ONEMIN = "1m",
    ONEMINLAST = "1mlast",
    ONEHOUR = "1h",
    ONEHOURLAST = "1hlast",
    ONEWEEK = "1w",
    ONEWEEKLAST = "1wlast"
}

export class Orderbook {
    bids : Order[];
    asks : Order[];
    bidsDepth: Map<string, string>;
    asksDepth: Map<string, string>;
    baseAsset : string;
    quoteAsset : string = BASE_CURRENCY;
    lastTradeId : number;
    currentPrice : number;
    timeBucket : Map<string, string>;
    candles : Map<CandleTypes, Candle>

    constructor(baseAsset: string, bids: Order[], asks: Order[], lastTradeId : number, currentPrice : number) {
        this.bids = bids
        this.asks = asks
        this.bidsDepth = new Map()
        this.asksDepth = new Map()
        this.baseAsset = baseAsset
        this.lastTradeId = lastTradeId
        this.currentPrice = currentPrice
        this.timeBucket = new Map([[CandleTypes.ONEMIN, getMinuteKey(Date.now())], 
                                   
                                   [CandleTypes.ONEHOUR, getHourKey(Date.now())],
                                   
                                   [CandleTypes.ONEWEEK, getWeekKey(Date.now())],
                                   
                                ])
        this.candles = new Map()
    }

    ticker() {
        return `${this.baseAsset}_${this.quoteAsset}`
    }

    getSnapshot() {
        return {
            baseAsset : this.baseAsset,
            bids : this.bids,
            asks : this.asks,
            lastTradeId : this.lastTradeId,
            currentPrice : this.currentPrice
        }
    }
    
    addOrder(order : Order): {
        executedQty:number
        fills : Fill[]
    } {
        if (order.side == "buy") {
            const {executedQty, fills } = this.matchBid(order)
            order.filled = executedQty
            
            // check if the full quantity matched then return other wise add it to bids and return
            if (executedQty === order.quantity) {
                
                return {
                    executedQty, 
                    fills
                }

            }
            this.bids.push(order);
            // add the unfilled quantiy for the price to bids depth
            this.updateDepth("bids",(order.quantity-order.filled), String(order.price), "add")
                
            return {
                executedQty, 
                fills
            }

        } else {
            const {executedQty, fills} = this.matchAsk(order);
            order.filled = executedQty;
           
      
            // check if the full qunty matched then return otherwise add it to asks and return
            if (executedQty === order.quantity) {
                    
                return {
                    executedQty, 
                    fills
                }
            }
            this.asks.push(order);
            // add the unfilled quantiy for the price to asks depth
            this.updateDepth("asks",(order.quantity-order.filled), String(order.price), "add")
            return {
                executedQty,
                fills
            }
        }

        
        
        

    }

    matchBid(order : Order) : {fills : Fill[], executedQty : number} {

        const fills: Fill[] = []
        let executedQty = 0
 
        for (let i=0; i<this.asks.length; i++) {
        
            // self trade prevention
            if (this.asks[i].userId === order.userId) {
                continue
            }

       
            if ( this.asks[i].price <= order.price && executedQty < order.quantity) {
                const filledQty = Math.min((order.quantity - executedQty), this.asks[i].quantity-this.asks[i].filled)
                executedQty += filledQty
                this.asks[i].filled += filledQty;
                const timeMatched = Date.now()
                // subtract the filled quantities in depthMap
                this.updateDepth("asks",filledQty, String(this.asks[i].price),"substract")
                fills.push({
                    price : this.asks[i].price.toString(),
                    qty : filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: this.asks[i].userId,
                    markerOrderId : this.asks[i].orderId,
                    timestamp : timeMatched
                })

                this.createOHLCVForTimeFrames(timeMatched, this.asks[i].price)
                this.currentPrice = this.asks[i].price
            
        
            }
        }

        for (let i=0; i<this.asks.length; i++) {
            if (this.asks[i].filled === this.asks[i].quantity) {
                this.asks.splice(i,1);
                i--;
            }
        }

        return {
            fills,
            executedQty 
        }
    }

    matchAsk(order : Order) : {fills : Fill[], executedQty: number} {
        const fills: Fill[] = []
        let executedQty = 0;
 
 
        for (let i=0; i < this.bids.length;i++) {
            
            // self trade prevention
            if (this.bids[i].userId === order.userId) {
                continue
            }
            
            if (this.bids[i].price >= order.price && executedQty < order.quantity){
                const filledBids = Math.min(order.quantity - executedQty, this.bids[i].quantity-this.bids[i].filled)
                executedQty += filledBids;
                this.bids[i].filled += filledBids;
                const timeMatched = Date.now()
                // subtract the filled quantities in depthMap
                this.updateDepth("bids",filledBids, String(this.bids[i].price),"substract")
                
                fills.push({
                    price : this.bids[i].price.toString(),
                    qty: filledBids,
                    tradeId : this.lastTradeId++,
                    otherUserId: this.bids[i].userId,
                    markerOrderId: this.bids[i].orderId,
                    timestamp : timeMatched
                })

                this.createOHLCVForTimeFrames(timeMatched,this.bids[i].price)

                this.currentPrice = this.bids[i].price
                
     
            }
        }

        for (let i=0;i<this.bids.length; i++){
            if (this.bids[i].filled === this.bids[i].quantity) {
                this.bids.splice(i,1)
                i--;
            }
        }

        return {
            fills,
            executedQty
        }
    }

    

    updateDepth(sideType: "bids"|"asks", quantity: number, price: string, type: "add"|"substract") {

        if (sideType == "bids") {

            if (type == "add" ){
                const current = this.bidsDepth.get(price) ?? 0
                this.bidsDepth.set(price, String(Number(current)+ Number(quantity)))
                
            } else {
                const current = this.bidsDepth.get(price) ?? 0
                // check if the final quantity is not zero if it is remove it from the corresponding map
                const newQty = Number(current) - quantity
                if (newQty > 0) {
                    this.bidsDepth.set(price, String(newQty))
                } else {
                    this.bidsDepth.delete(price)
                }
            }
            

        } else {
            if (type == "add") {
                const current = this.asksDepth.get(price) ?? 0;
                this.asksDepth.set(price, String(Number(current)+Number(quantity)))
            } else {
                const current = this.asksDepth.get(price) ?? 0
                // check if the final quantity is not zero if it is remove it from the corresponding map
                const newQty = Number(current)-quantity;
                if (newQty>0){
                    this.asksDepth.set(price, String(newQty))
                } else {
                    this.asksDepth.delete(price)
                }
            }
        }

    }

    
    getDepth() {
        
        return {
            bids : Array.from(this.bidsDepth),
            price: this.currentPrice.toString(),
            asks : Array.from(this.asksDepth)
        }
    }

    getOpenOrders(userId:string): Order[] {
        const asks = this.asks.filter(x => x.userId === userId);
        const bids = this.bids.filter(x => x.userId === userId);
        return [...asks, ...bids];
        
    }

    cancelBid(order: Order) {
        const index = this.bids.findIndex(x => x.orderId === order.orderId)
        if (index !== -1) {
            const price = this.bids[index].price;
            // decrease the cancelled bid quantiy from depth
            this.updateDepth("bids", this.bids[index].quantity, String(price), "substract")
            this.bids.splice(index,1)
            return price
        }
        
    }

    cancelAsk(order : Order) {
        const index = this.asks.findIndex(x => x.orderId === order.orderId)
        if (index !== -1) {
            const price = this.asks[index].price;
            // decrease the cancelled ask quantiy from depth
            this.updateDepth("asks", this.asks[index].quantity, String(price), "substract")
            this.asks.splice(index,1)
            return price
        }
    }

    createOHLCVForTimeFrames(interval: number, price : number) {

        // ONEMIN
        this.createOrUpdateCandle(interval, price,TimeFrame.ONEMIN, CandleTypes.ONEMIN, CandleTypes.ONEMINLAST)
        // ONEHOUR
        this.createOrUpdateCandle(interval, price,TimeFrame.ONEHOUR, CandleTypes.ONEHOUR, CandleTypes.ONEHOURLAST)
        // ONEWEEK
        this.createOrUpdateCandle(interval, price,TimeFrame.ONEWEEK, CandleTypes.ONEWEEK, CandleTypes.ONEWEEKLAST)
    }

    createOrUpdateCandle(interval: number, price : number, timeFrame: TimeFrame, candle: CandleTypes, lastCandle: CandleTypes) {

        if (this.timeBucket.get(timeFrame) !== getTimeKey(interval, timeFrame)) {
            this.timeBucket.set(timeFrame, getTimeKey(interval, timeFrame))
     
            // update the existing one to last candle and set close price
            this.candles.set(lastCandle, {
                open : this.candles.get(candle)?.open,
                close : this.candles.get(candle)?.current,
                low : this.candles.get(candle)?.low,
                high : this.candles.get(candle)?.high,
                timestamp : getTimeKey(interval, timeFrame)
            })

            // create a new candle
            this.candles.set(candle, {
                open : price,
                low : price,
                high : price,
                timestamp : getTimeKey(interval, timeFrame),
                current : price
            })
            
        } else {
            const curLow = this.candles.get(candle)?.low ?? Number.MAX_SAFE_INTEGER
            const curHigh = this.candles.get(candle)?.high ?? Number.MIN_SAFE_INTEGER
            this.candles.set(candle, {
                ...this.candles.get(candle),
                low : Math.min(curLow, price),
                high : Math.max(curHigh, price),
                current : price
            })
        }
    }

    getCandles() {
        return Object.fromEntries(this.candles)
    }
}