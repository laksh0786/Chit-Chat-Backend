import express from "express"
import { dbConnect } from './utils/database.js'
import dotenv from "dotenv"
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { NEW_MESSAGE } from "./constants/event.js";
import { v4 as uuid } from "uuid"


//importing the routes
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const node_env = process.env.NODE_ENV.trim() || "PRODUCTION";
const adminSecretKey = process.env.ADMIN_SECRET_KEY.trim() || "admin"


// import { createGroupChats, createMessagesInAChat, createSingleChats } from "./seeders/chat.js";



dotenv.config({
    path: "./.env"
});

//creating the express app
const app = express();

//creating the http server
const server = createServer(app);

//creating the socket server
const io = new Server(server, {
    cors: {
        origin: "*", //allowing all the origins
        credentials: true //allowing credentials means allowing cookies
    }
})

//using middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
app.use("/user", userRoutes);
app.use("/chat", chatRoutes);
app.use("/admin", adminRoutes);



app.get("/", (req, resp) => {
    resp.send("Hello World");
})


//socket connection
io.on("connection", (socket) => {

    const user = {
        _id:"dbnubdowqbdw",
        name:"Lakshay"
    }

    console.log("User connected : ", socket.id);

    //listening for new message event i.e. when a new message is sent by the client then this event will be emitted
    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {

        const messageForRealTime = {
            content: message, 
            _id: uuid(),   
            sender: {
                _id: user._id,  
                name: user.name,
            },
            chat: chatId,
            createdAt: new Date().toISOString()
        }

        const messageForDB = {
            content: message, 
            sender: user._id,
            chat: chatId,
        }

        console.log("Message : ", messageForRealTime);

    })

    socket.on("disconnect", () => {
        console.log("User disconnected : ", socket.id);
    })

})


//using error middleware at last so that it can catch all the errors that are thrown in the application
app.use(errorMiddleware)



const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port} in ${node_env} mode`);
})


export { node_env, adminSecretKey };






//socket.io main concepts
// 1. connection - when a user connects to the server
// 2. disconnect - when a user disconnects from the server
// 3. emit - sending data from the server to the client i.e. sending data
// 4. on - listening for the data from the client i.e. receiving data and performing some action on it
// 5. broadcast - sending data to all the clients connected to the server except the sender
// 6. rooms - creating a separate room for the clients to join and communicate with each other
// 7. join - joining a room
// 8. leave - leaving a room
// 9. to - sending data to a specific room
// 10. in - sending data to a specific room
// 11. of - creating a namespace i.e. creating a separate connection for the clients
// 12. disconnecting - disconnecting a client from the server
