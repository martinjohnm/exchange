
import {
    CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";


export class ChartManager {
    private candleSeries : ISeriesApi<"Candlestick">;
    private lastUpdateTime: number = 0;
    private chart: any;
    private currentBar: {
        open: number | null;
        high: number | null;
        low: number | null;
        close: number | null;
    } = {
        open: null, 
        high: null,
        low: null,
        close: null
    }

    constructor(
        ref : any,
        initialData: any[],
        layout: { background: string, color: string }
    ) {
        const chart  = createChart(ref, {
            autoSize : true,
            overlayPriceScales : {
                ticksVisible: true,
                borderVisible: true,
            },
            crosshair: {
                mode: CrosshairMode.Normal
            }, 
            rightPriceScale : {
                visible: true,
                ticksVisible: true,
                entireTextOnly : true
            },
            grid: {
                horzLines: {
                visible: false,
                },
                vertLines: {
                visible: false,
                },
            },
            layout: {
                background: {
                type: ColorType.Solid,
                color: layout.background,
                },
                textColor: "white",
            },
        })

        this.chart = chart;
        this.candleSeries = chart.addSeries(CandlestickSeries);


        this.candleSeries.setData(
        initialData.map((data) => ({
            ...data,
            time: (data.timestamp / 1000) as UTCTimestamp,
        }))
        );
    }

    public update(updatedcandle: {
            low: number,
            high: number,
            open: number,
            current: number,
            timestamp : string
    }) {

        const decodedTime = parseInt(updatedcandle.timestamp, 36);

        console.log(decodedTime);
        
        if ( decodedTime !== this.lastUpdateTime ) {
            this.lastUpdateTime = decodedTime;
        }

        this.candleSeries.update({
            time: (this.lastUpdateTime / 1000) as UTCTimestamp,
            close : updatedcandle.current,
            low : updatedcandle.low,
            high : updatedcandle.high,
            open : updatedcandle.open,
            
        });

        // if (updatedPrice.newCandleInitiated) {
        // this.lastUpdateTime = updatedPrice.time;
        // }
    }
    public destroy() {
        this.chart.remove();
    }
}