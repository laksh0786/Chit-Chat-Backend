//this function will return the other member of the chat

import { userSocketIds } from "../app.js";

//members is the array of members of the chat and if the userId is not equal to the member id then return that member object as we have use find method so it will return the first member object which is not equal to the userId
export const getOtherMember = (members, userId) => {
    return members.find(member => member._id.toString() !== userId.toString());
}



//get socket ids of the users and return the array of socket ids
export const getSockets = (users = [])=>{

    //getting the array of socket ids of the users
    const sockets = users.map(user=>{
        return userSocketIds.get(user.toString());
    })

    //returning the array of socket ids
    return sockets;
}


//get base 64 string 
export const getBase64 = (file) => {
    //base 64 string representation of the file buffer that we have received from the client
    //we are using base 64 encoding to convert the buffer to string
    return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
}