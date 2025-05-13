import axios from "axios";


const BE_URL= "http://localhost:3001";
const USER_ID = "5"
const MARKET = "TATA_INR";


async function main() {
    const openOrders = await axios.get(`${BE_URL}/api/v1/order/open?userId=${USER_ID}&market=${MARKET}`);
    console.log(openOrders.data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    main()
}

main()