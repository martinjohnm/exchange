import { CancelOrderMessageFromApi, CreateOrderMessageFromApi } from "./fromApi";


export const TRADE_ADDED = "TRADE_ADDED";
export const ORDER_UPDATE = "ORDER_UPDATE";



type MessageMap = {
    CREATE_ORDER : CreateOrderMessageFromApi,
    CANCEL_ORDER : CancelOrderMessageFromApi,

}
type Message<T extends keyof MessageMap = keyof MessageMap> = {
    type: T;
    data: MessageMap[T];
  };

export type AllMessages = {
    [K in keyof MessageMap]: Message<K>;
  }[keyof MessageMap];