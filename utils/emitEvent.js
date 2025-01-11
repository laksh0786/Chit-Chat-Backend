import { getSockets } from "../lib/helper.js"

export const emitEvent = (req, event, users, data) => {
    
    const io = req.app.get("io");
    

    const userSockets = getSockets(users);

    io.to(userSockets).emit(event , data)
    
}