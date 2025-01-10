import express from "express"
import { dbConnect } from './utils/database.js'
import dotenv from "dotenv"
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants/event.js";
import { v4 as uuid } from "uuid"
import { getSockets } from "./lib/helper.js";
import cors from "cors";
import { corsOptions } from "./constants/config.js";
import { cloudinary } from "./config/cloudinary.js";


//importing the routes
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import adminRoutes from "./routes/admin.routes.js";



//importing the models
import Message from "./models/message.model.js";
import { socketAuthenticator } from "./middlewares/auth.js";


const node_env = process.env.NODE_ENV.trim() || "PRODUCTION";
const adminSecretKey = process.env.ADMIN_SECRET_KEY.trim() || "admin"

//user socket id and user id mapping

//MAP is a collection of elements where each element is stored as a Key, value pair.
const userSocketIds = new Map();  //key is user id and value is socket id of the user Map<userId, socketId>


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
    cors: corsOptions
})

//using middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));


//connecting to the database
dbConnect(process.env.MONGO_URI);


//creating fake data
// createUser(10);  //use only when use to cvreate fake users
// createSingleChats(10); //use only when use to create fake chats
// createGroupChats(10); //use only when use to create fake group chats
// createMessagesInAChat("67697f3b9a4d4b8e38a4c225" , 50);

app.get("/", (req, resp) => {
    resp.send("Hello World");
})


//mounting the router
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/admin", adminRoutes);



//creating the socket middleware for authentication
io.use((socket, next) => {

    cookieParser()(socket.request, socket.request.res, async (err) => {
        await socketAuthenticator(err, socket, next);
    });

})


//socket connection
io.on("connection", (socket) => {

    const user = socket.user;

    // console.log(user);

    //mapping the user id with the socket id using the set method of the map
    userSocketIds.set(user?._id.toString(), socket.id);

    // console.log("User connected : ", socket.id);
    console.log(userSocketIds);

    //listening for new message event i.e. when a new message is sent by the client then this event will be emitted
    //first argument is the event name and the second argument is the callback function which will be called when the event is emitted and it will receive the data sent by the client as an argument
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
        
        console.log("Emitting ", messageForRealTime)

        //getting the user socket ids in the array
        const membersSocket = getSockets(members);

        //emitting the NEW_MESSAGE event to all the members of the chat
        io.to(membersSocket).emit(NEW_MESSAGE, {
            chatId,
            message: messageForRealTime
        });

        //emitting the NEW_MESSAGE_ALERT event to all the members of the chat except the sender
        io.to(membersSocket).emit(NEW_MESSAGE_ALERT, {
            chatId,
        })

        try {
            //saving the message to the database
            await Message.create(messageForDB);
        } catch (err) {
            console.log(err);
        }

    })

    socket.on("disconnect", () => {

        //deleting the user id from the map when the user is disconnected
        userSocketIds.delete(user._id.toString());

        console.log("User disconnected : ", socket.id);
    })

})


//using error middleware at last so that it can catch all the errors that are thrown in the application
app.use(errorMiddleware)



const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is running on port ${port} in ${node_env} mode`);
})


export { node_env, adminSecretKey, userSocketIds };






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
