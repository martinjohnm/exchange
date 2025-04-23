import { Client } from "pg";
import { createClient } from "redis";


const pgClient = new Client({
    user : "new_user",
    host : "localhost",
    database : "my_database",
    password : "password",
    port : 5432
})
pgClient.connect()

async function main() {
    const redisClient = createClient();
    await redisClient.connect()
    console.log("connected to redis");

    while (true) {
        
    }
    
}