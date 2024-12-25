//this function will return the other member of the chat

//members is the array of members of the chat and if the userId is not equal to the member id then return that member object as we have use find method so it will return the first member object which is not equal to the userId
export const getOtherMember = (members, userId) => {
    return members.find(member => member._id.toString() !== userId.toString());
}