import { CancelOrderMessageFromApi, CreateOrderMessageFromApi } from "./fromApi";

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