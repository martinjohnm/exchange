"use client";

export const Markets = () => {


  return (
    <div className="flex flex-col flex-1 max-w-[1280px] w-full">
      <div className="flex flex-col min-w-[700px] flex-1 w-full">
        <div className="flex flex-col w-full rounded-lg bg-baseBackgroundL1 px-5 py-3">
          <table className="w-full table-auto">
            <MarketHeader />
          </table>
        </div>
      </div>
    </div>
  );
};

function MarketHeader() {
  return (
      <thead>
        <tr className="">
          <th className="px-2 py-3 text-left text-sm font-normal text-baseTextMedEmphasis">
            <div className="flex items-center gap-1 cursor-pointer select-none">
              Name<span className="w-[16px]"></span>
            </div>
          </th>
          <th className="px-2 py-3 text-left text-sm font-normal text-baseTextMedEmphasis">
            <div className="flex items-center gap-1 cursor-pointer select-none">
              Price<span className="w-[16px]"></span>
            </div>
          </th>
          <th className="px-2 py-3 text-left text-sm font-normal text-baseTextMedEmphasis">
            <div className="flex items-center gap-1 cursor-pointer select-none">
              Market Cap<span className="w-[16px]"></span>
            </div>
          </th>
          <th className="px-2 py-3 text-left text-sm font-normal text-baseTextMedEmphasis">
            <div className="flex items-center gap-1 cursor-pointer select-none">
              24h Volume
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-down h-4 w-4"
              >
                <path d="M12 5v14"></path>
                <path d="m19 12-7 7-7-7"></path>
              </svg>
            </div>
          </th>
          <th className="px-2 py-3 text-left text-sm font-normal text-baseTextMedEmphasis">
            <div className="flex items-center gap-1 cursor-pointer select-none">
              24h Change<span className="w-[16px]"></span>
            </div>
          </th>
        </tr>
      </thead>
  );
}