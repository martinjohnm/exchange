import { CANCEL_ORDER, CREATE_ORDER, GET_DEPTH, GET_OPEN_ORDERS, ON_RAMP } from "."

export interface CreateOrderMessageToEngine {
    type: typeof CREATE_ORDER
    data: {
        market: string
        price: string
        quantity: string
        side: "buy" | "sell"
        userId: string
    }
}
export interface CancelOrderMessageToEngine {
    type: typeof CANCEL_ORDER
    data: {
        orderId: string
        market: string
    }
} 
export interface OnRampMessageToEngine {
    type: typeof ON_RAMP
    data: {
        amount: string
        userId: string
        txnId: string
    }
} 
export interface GetDepthMessageToEngine {
    type: typeof GET_DEPTH
    data: {
        market: string
    }
} 
export interface GetOpenOrdersMessageToEngine {
    type: typeof GET_OPEN_ORDERS
    data: {
        userId: string
        market: string
    }
}