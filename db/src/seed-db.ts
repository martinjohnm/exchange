import { Client } from "pg";


const client = new Client({
    user: 'your_user',
    host: 'localhost',
    database: 'my_database',
    password: 'your_password',
    port: 5432,
});

async function initializeDB() {
    await client.connect();

    await client.query(`
        DROP MATERIALIZED VIEW IF EXISTS klines_1m;
        DROP MATERIALIZED VIEW IF EXISTS klines_1h;
        DROP MATERIALIZED VIEW IF EXISTS klines_1w;
        DROP TABLE IF EXISTS "tata_prices";
        DROP TABLE IF EXISTS "open_orders";
        CREATE TABLE "tata_prices"(
            time            TIMESTAMP WITH TIME ZONE NOT NULL,
            price   DOUBLE PRECISION,
            volume      DOUBLE PRECISION,
            currency_code   VARCHAR (10)
        );
        CREATE TABLE "open_orders"(
            id UUID PRIMARY KEY,
            user_id UUID,
            side TEXT,
            price DOUBLE PRECISION,
            executed_quantity DOUBLE PRECISION,
            quantity DOUBLE PRECISION,
            created_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ
        );
        
        SELECT create_hypertable('tata_prices', 'time', 'price', 2);
    `);

    await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m AS
        SELECT
            time_bucket('1 minute', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
    `);

    await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h AS
        SELECT
            time_bucket('1 hour', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
    `);

    await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1w AS
        SELECT
            time_bucket('1 week', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            sum(volume) AS volume,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
    `);

    await client.end();
    console.log("Database initialized successfully");
}

initializeDB().catch(console.error);
