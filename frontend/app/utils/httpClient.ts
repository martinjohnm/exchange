import axios from "axios";
import { Depth, KLine, Ticker, Trade } from "./types";

const BASE_URL = "http://localhost:3001/api/v1";

export async function getTicker(market: string): Promise<Ticker> {
    const tickers = await getTickers();
    console.log(tickers);
    
    const ticker = tickers.find(t => t.symbol === market);
    if (!ticker) {
        throw new Error(`No ticker found for ${market}`);
    }
    return ticker;
}

export async function getTickers(): Promise<Ticker[]> {
    const response = await axios.get(`${BASE_URL}/tickers`);
    return response.data as Promise<Ticker[]>;
}


export async function getDepth(market: string): Promise<{type: string, payload: Depth}> {
    const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`);
    return response.data as {type: string, payload: Depth};
}

// export async function getTrades(market: string): Promise<Trade[]> {
//     const response = await axios.get(`${BASE_URL}/trades?symbol=${market}`);
//     return response.data as Promise<Trade>;
// }

export async function getKlines(market: string, interval: string, startTime: number, endTime: number): Promise<KLine[]> {
    const response = await axios.get(`${BASE_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`);
    //@ts-ignore
    const data: KLine[] = response.data;
    return data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
}
