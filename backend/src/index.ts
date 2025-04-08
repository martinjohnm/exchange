


import express from "express"
import cors from "cors"
import { tickersRouter } from "./routes/ticker"

const app = express()

app.use(cors())
app.use(express.json())

app.use("api/v1/tickers", tickersRouter)
app.use("api/v1/depth")

app.listen(3001, () => {
    console.log("Server is running on 3001");
    
})