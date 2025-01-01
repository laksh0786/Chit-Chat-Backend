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
        return userSocketIds.get(user._id.toString());
    })

    //returning the array of socket ids
    return sockets;
}