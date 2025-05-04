
export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";

export const GET_DEPTH = "GET_DEPTH";
export const GET_TICKER = "GET_TICKER";


export enum OrderType {
    CREATE_ORDER = "CREATE_ORDER",
    CANCEL_ORDER = "CANCEL_ORDER",
    ON_RAMP = "ON_RAMP",
    GET_OPEN_ORDERS = "GET_OPEN_ORDERS",
    GET_TICKER = "GET_TICKER"

}

export interface CreateOrderMessageFromApi {
    type: OrderType.CREATE_ORDER
    data: {
        market: string
        price: string
        quantity: string
        side: "buy" | "sell"
        userId: string
    }
}
export interface CancelOrderMessageFromApi {
    type: OrderType.CANCEL_ORDER
    data: {
        orderId: string
        market: string
    }
} 
export interface OnRampMessageFromApi {
    type: OrderType.ON_RAMP
    data: {
        amount: string
        userId: string
        txnId: string
    }
} 

// export interface GetDepthMessageFromApi {
//     type:
//     data: {
//         market: string
//     }
// } 
// export interface GetOpenOrdersMessageFromApi {
//     type: typeof GET_OPEN_ORDERS
//     data: {
//         userId: string
//         market: string
//     }
// }


export type MessageTypeToENgine = CreateOrderMessageFromApi | CancelOrderMessageFromApi | OnRampMessageFromApi