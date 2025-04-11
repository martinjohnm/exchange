


import express from "express"
import cors from "cors"
import { tickersRouter } from "./routes/ticker"
import { depthRouter } from "./routes/depth"
import { orderRouter } from "./routes/order"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/v1/order", orderRouter)
app.use("/api/v1/tickers", tickersRouter)
app.use("/api/v1/depth", depthRouter)

app.listen(3001, () => {
    console.log("Server is running on 3001");
    
})