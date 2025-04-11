
export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";

export const GET_DEPTH = "GET_DEPTH";


export interface CreateOrderMessageFromApi {
    type: typeof CREATE_ORDER
    data: {
        market: string
        price: string
        quantity: string
        side: "buy" | "sell"
        userId: string
    }
}
export interface CancelOrderMessageFromApi {
    type: typeof CANCEL_ORDER
    data: {
        orderId: string
        market: string
    }
} 
export interface OnRampMessageFromApi {
    type: typeof ON_RAMP
    data: {
        amount: string
        userId: string
        txnId: string
    }
} 
export interface GetDepthMessageFromApi {
    type: typeof GET_DEPTH
    data: {
        market: string
    }
} 
export interface GetOpenOrdersMessageFromApi {
    type: typeof GET_OPEN_ORDERS
    data: {
        userId: string
        market: string
    }
}