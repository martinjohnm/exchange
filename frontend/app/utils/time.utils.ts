


export function onNextMinute(callback: () => void): void {
  const now = new Date();
  const seconds = now.getSeconds();
  const milliseconds = now.getMilliseconds();

  const delay = ((60 - seconds) * 1000) - milliseconds;


  setTimeout(() => {
        console.log("⏰ Alarm triggered!");
  }, delay);
}


export function setAlarmOneMinuteLater(callback: () => void): void {
    const oneMinute = 60 * 1000; // 1 minute in milliseconds

    setTimeout(() => {
        console.log("⏰ Alarm triggered!");
    }, oneMinute);
}
