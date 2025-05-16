import axios from "axios";


const BE_URL= "http://localhost:3001";
const USER_ID = "5"
const MARKET = "TATA_INR";
const TOTAL_BIDS = 15;
const TOTAL_ASK = 15;

async function main() {

    const price = generateUniformPrice()


    
    await axios.post(`${BE_URL}/api/v1/order`, {
            market : "TATA_INR",
            price : (price - Math.random() * 1).toFixed(1).toString(), 
            quantity : "1", 
            side : "sell", 
            userId : "2" 
        }
    )



    await axios.post(`${BE_URL}/api/v1/order`, {
            market : "TATA_INR",
            price : (price - Math.random() * 1).toFixed(1).toString(), 
            quantity : "1", 
            side : "buy", 
            userId : "1" 
        }
    )

    await axios.post(`${BE_URL}/api/v1/order`, {

            market : "TATA_INR",
            price : (price - Math.random() * 1).toFixed(1).toString(), 
            quantity : "1", 
            side : "sell", 
            userId : "1" 

    })

    await axios.post(`${BE_URL}/api/v1/order`, {

            market : "TATA_INR",
            price : (price - Math.random() * 1).toFixed(1).toString(), 
            quantity : "1", 
            side : "buy", 
            userId : "2" 

    })

    await new Promise(resolve => setTimeout(resolve, 1000));

    main()

}


const generateUniformPrice = (mean = 380, spread = 20) => {
  const min = mean - spread;
  const max = mean + spread;
  const price = Math.random() * (max - min) + min;
  return Number(price.toFixed(2));
};
    


main()