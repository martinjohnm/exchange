"use client";

import { useEffect, useState } from "react";
import { AskTable } from "./AskTable";
import { BidTable } from "./BidTable";
import { SignalingManager } from "@/app/utils/SignalingManager";
import { getDepth, getTicker } from "@/app/utils/httpClient";
export function Depth({ market }: {market: string}) {
    const [bids, setBids] = useState<[string, string][]>();
    const [asks, setAsks] = useState<[string, string][]>();
    const [price, setPrice] = useState<string>("67");
    
    useEffect(() => {
        SignalingManager.getInstance().registerCallBack("depth", (data: any) => {
            console.log("depth has been updated");
            console.log(data);
            
            setBids(() => {
                return data.bids.sort((x:any, y:any) => Number(y[0]) - Number(x[0]));
            });

            setAsks(() => {
                
                return data.asks.sort((x : any, y:any) => Number(y[0]) - Number(x[0]));; 
            });

            setPrice(data.price)

        }, `DEPTH-${market}`)

        SignalingManager.getInstance().sendMessage({"method" : "SUBSCRIBE", "params":[`depth@${market}`]})

        getDepth(market).then(d => {   
            console.log(d.payload);
            
            setBids(d.payload.bids);
            setAsks(d.payload.asks.reverse());
            setPrice(d.payload.price)
        });

        // getTicker(market).then(t => setPrice(t.lastPrice));



        return () => {
            SignalingManager.getInstance().sendMessage({"method":"UNSUBSCRIBE","params":[`depth@${market}`]});
            SignalingManager.getInstance().deregisterCallBack("depth", `DEPTH-${market}`);
        }

    }, [])


    


    return <div>
        
        <div>
            
        </div>
        <TableHeader />
        {asks && <AskTable asks={asks} />}
        {price && <div>{price}</div>}
        {bids && <BidTable bids={bids} />}
    </div>
}

function TableHeader() {
    return <div className="flex justify-between text-xs">
    <div className="text-white">Price</div>
    <div className="text-slate-500">Size</div>
    <div className="text-slate-500">Total</div>
</div>
}