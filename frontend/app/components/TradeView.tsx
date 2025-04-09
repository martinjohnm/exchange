import { useEffect, useRef } from "react";

export function TradeView({
  market,
}: {
  market: string;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  return (
    <>
      <div ref={chartRef} className="bg-red-200" style={{ height: "520px", width: "100%", marginTop: 4 }}></div>
    </>
  );
}
