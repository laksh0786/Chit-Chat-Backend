const corsOptions = {
    origin: ["http://localhost:5173", "http://localhost:4173", process.env.CLIENT_URL],
    credentials: true  //allowing credentials means allowing cookies to be sent
}


export {corsOptions};