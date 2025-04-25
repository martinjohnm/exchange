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
}

export class Orderbook {
    bids : Order[];
    asks : Order[];
    bidsDepth: Map<string, number>;
    asksDepth: Map<string, number>;
    baseAsset : string;
    quoteAsset : string = BASE_CURRENCY;
    lastTradeId : number;
    currentPrice : number;

    constructor(baseAsset: string, bids: Order[], asks: Order[], lastTradeId : number, currentPrice : number) {
        this.bids = bids
        this.asks = asks
        this.bidsDepth = new Map()
        this.asksDepth = new Map()
        this.baseAsset = baseAsset
        this.lastTradeId = lastTradeId
        this.currentPrice = currentPrice
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
                console.log(this.bidsDepth, this.asksDepth);
                
                return {
                    executedQty, 
                    fills
                }

            }
            this.bids.push(order);
            // add the unfilled quantiy for the price to bids depth
            this.updateDepth("bids",(order.quantity-order.filled), String(order.price), "add")
            console.log(this.bidsDepth, this.asksDepth);
                
            return {
                executedQty, 
                fills
            }

        } else {
            const {executedQty, fills} = this.matchAsk(order);
            order.filled = executedQty;
           
      
            // check if the full qunty matched then return otherwise add it to asks and return
            if (executedQty === order.quantity) {
                    console.log(this.bidsDepth,this.asksDepth);
                    
                return {
                    executedQty, 
                    fills
                }
            }
            this.asks.push(order);
            // add the unfilled quantiy for the price to asks depth
            this.updateDepth("asks",(order.quantity-order.filled), String(order.price), "add")
            console.log(this.bidsDepth, this.asksDepth);            
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
                // subtract the filled quantities in depthMap
                this.updateDepth("asks",filledQty, String(this.asks[i].price),"substract")
                fills.push({
                    price : this.asks[i].price.toString(),
                    qty : filledQty,
                    tradeId: this.lastTradeId++,
                    otherUserId: this.asks[i].userId,
                    markerOrderId : this.asks[i].orderId
                })
            
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
                // subtract the filled quantities in depthMap
                this.updateDepth("bids",filledBids, String(this.bids[i].price),"substract")
                fills.push({
                    price : this.bids[i].price.toString(),
                    qty: filledBids,
                    tradeId : this.lastTradeId++,
                    otherUserId: this.bids[i].userId,
                    markerOrderId: this.bids[i].orderId
                })

          
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
                this.bidsDepth.set(price, current+ quantity)
                
            } else {
                const current = this.bidsDepth.get(price) ?? 0
                // check if the final quantity is not zero if it is remove it from the corresponding map
                const newQty = current - quantity
                if (newQty > 0) {
                    this.bidsDepth.set(price, newQty)
                } else {
                    this.bidsDepth.delete(price)
                }
            }
            

        } else {
            if (type == "add") {
                const current = this.asksDepth.get(price) ?? 0;
                this.asksDepth.set(price, current+quantity)
            } else {
                const current = this.asksDepth.get(price) ?? 0
                // check if the final quantity is not zero if it is remove it from the corresponding map
                const newQty = current-quantity;
                if (newQty>0){
                    this.asksDepth.set(price, newQty)
                } else {
                    this.asksDepth.delete(price)
                }
            }
        }

    }

    getDepth() {
        const bids: [string, number][] = [];
        const asks: [string, number][] = [];
        for (const price in this.bidsDepth) {
            bids.push([price, this.bidsDepth.get(price) ?? 0])
        }

        for (const price in this.asksDepth) {
            asks.push([price, this.asksDepth.get(price) ?? 0])
        }

        return {
            bids,
            asks
        }
    }

    cancelBid(order: Order) {
        const index = this.bids.findIndex(x => x.orderId === order.orderId)
        if (index !== -1) {
            const price = this.bids[index].price;
            this.bids.splice(index,1)
            return price
        }
        
    }

    cancelAsk(order : Order) {
        const index = this.asks.findIndex(x => x.orderId === order.orderId)
        if (index !== -1) {
            const price = this.asks[index].price;
            this.asks.splice(index,1)
            return price
        }
    }
}