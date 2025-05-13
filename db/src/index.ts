import { Client } from "pg";
import { createClient } from "redis";
import { DbMessage } from "./types";
import { createCandleSticks } from "./cron";


const pgClient = new Client({
    user : "your_user",
    host : "localhost",
    database : "my_database",
    password : "your_password",
    port : 5432
})
pgClient.connect()

async function main() {
    const redisClient = createClient();
    await redisClient.connect()
    console.log("connected to redis");

    createCandleSticks()

    while (true) {
        const response = await redisClient.rPop('db_processor' as string)

        if (!response) {

        } else {
            const data: DbMessage = JSON.parse(response)

            if (data.type === "TRADE_ADDED") {
                console.log("adding data");
                console.log(data);
                const price = data.data.price;
                const timestamp = new Date(data.data.timestamp);
                const quantity = data.data.quantity;
                const query = 'INSERT INTO tata_prices (time, price, volume) VALUES ($1, $2, $3)';
                const values = [timestamp, price, quantity];
                await pgClient.query(query, values);
            }

            if (data.type === "ORDER_UPDATE") {
                console.log(data);
            
                const id = data.data.orderId;
                const side = data.data.side;
                const price = data.data.price;
                const quantity = data.data.quantity;
                const executed_quantity = data.data.executedQty;
                const query = `
                        INSERT INTO open_orders (id, side, price, quantity, executed_quantity)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (id)
                        DO UPDATE SET executed_quantity = open_orders.executed_quantity + EXCLUDED.executed_quantity
                        `;
                const values = [id, side, price, quantity, executed_quantity];
                await pgClient.query(query, values);
            }
        }
    }


    
    
}
main()