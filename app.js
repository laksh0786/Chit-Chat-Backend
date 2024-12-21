import express from "express"
import  {dbConnect} from './utils/database.js'
import dotenv from "dotenv"
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";


//importing the routes
import userRoutes from "./routes/user.routes.js";


dotenv.config({
    path:"./.env"
});

const app = express();


//using middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


//connecting to the database
dbConnect(process.env.MONGO_URI);


// app.get("/" , (req , resp)=>{
//     resp.send("Hello World");
// })


//mounting the router
app.use("/user" , userRoutes);



//using error middleware at last so that it can catch all the errors that are thrown in the application
app.use(errorMiddleware)



const port = process.env.PORT || 3000;
app.listen(port , ()=>{
    console.log(`Server is running on port ${port}`);
})