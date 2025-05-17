

import { useEffect, useRef, useState } from "react";
import { ChartManager } from "../utils/ChartManager";
import { getKlines } from "../utils/httpClient";
import { KLine } from "../utils/types";
import { SignalingManager } from "../utils/SignalingManager";
import { onNextMinute } from "../utils/time.utils";

export function TradeView({
  market,
}: {
  market: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager>(null);
  const [throttledPrice, setThrottledPrice] = useState("100")
  const [candles, setCandles] = useState<any[]>([])
  const [chartManageer, setChartManageer] = useState<ChartManager>()
  const [nextMinute, setNextMinute] = useState<boolean>(false)
  useEffect(() => {
    const init = async () => {
      let klineData: KLine[] = [];
      try {
        klineData = await getKlines(market, "1m", Math.floor((new Date().getTime() - 1000 * 60 * 60 * 24 * 7) / 1000), Math.floor(new Date().getTime() / 1000)); 

        
      } catch (e) { }

      if (chartRef) {
        if (chartManagerRef.current) {
          chartManagerRef.current.destroy();
        }
        // console.log(klineData)
        const chartManager = new ChartManager(
          chartRef.current,
          [
            ...klineData?.map((x) => ({
              close: parseFloat(x.close),
              high: parseFloat(x.high),
              low: parseFloat(x.low),
              open: parseFloat(x.open),
              timestamp: new Date(x.end), 
            })),
          ].sort((x, y) => (x.timestamp < y.timestamp ? -1 : 1)) || [],
          {
            background: "#0e0f14",
            color: "white",
          }
        );

        setChartManageer(chartManager)



        SignalingManager.getInstance().registerCallBack("candles", (data: any) => {
    
          console.log(data[0][1].open, data[0][1].low, data[0][1].high, data[0][1].current);
          
          chartManager.update({
            open : data[0][1].open,
            high : data[0][1].high,
            low : data[0][1].low,
            current : data[0][1].current
          })
   
        }, `CANDLES-${market}`)
       
        SignalingManager.getInstance().sendMessage({"method" : "SUBSCRIBE", "params":[`candles@${market}`]})

       
        //@ts-ignore
        chartManagerRef.current = chartManager;

        return () => {
            SignalingManager.getInstance().sendMessage({"method":"UNSUBSCRIBE","params":[`candles@${market}`]});
            SignalingManager.getInstance().deregisterCallBack("candles", `CANDLES-${market}`);
        }
        
      }
    };

    init();

    
  }, [market, chartRef]);

  
  // const updateCandle = () => {
   
  //     chartManageer?.update({
  //         close : Number(throttledPrice),
  //         low : Number(throttledPrice),
  //         high : Number(throttledPrice),
  //         open : Number(360),
  //         newCandleInitiated : false
  //       })
  // }

  // // useEffect(() => {
  // //   updateCandle()
  // // }, [nextMinute, throttledPrice])


//   function onNextMinute(): void {
//       const now = new Date();
//       const seconds = now.getSeconds();
//       const milliseconds = now.getMilliseconds();

//       const delay = 100;


//       setTimeout(() => {
//             console.log("⏰ Alarm triggered!");
//             setNextMinute(true)
//       }, delay);
// }

  return (
    <>
      <div ref={chartRef} className="" style={{ height: "520px", width: "100%", marginTop: 4 }}></div>
    </>
  );
}
