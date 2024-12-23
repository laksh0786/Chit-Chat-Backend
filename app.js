import express from "express"
import  {dbConnect} from './utils/database.js'
import dotenv from "dotenv"
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import { createUser } from "./seeders/user.js";


//importing the routes
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import { createGroupChats, createMessagesInAChat, createSingleChats } from "./seeders/chat.js";



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


//creating fake data
// createUser(10);  //use only when use to cvreate fake users
// createSingleChats(10); //use only when use to create fake chats
// createGroupChats(10); //use only when use to create fake group chats
// createMessagesInAChat("67697f3b9a4d4b8e38a4c225" , 50);

// app.get("/" , (req , resp)=>{
//     resp.send("Hello World");
// })


//mounting the router
app.use("/user" , userRoutes);
app.use("/chat" , chatRoutes);



//using error middleware at last so that it can catch all the errors that are thrown in the application
app.use(errorMiddleware)



const port = process.env.PORT || 3000;
app.listen(port , ()=>{
    console.log(`Server is running on port ${port}`);
})