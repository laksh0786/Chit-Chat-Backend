import multer from 'multer';


const multerUpload = multer({
    limits:{
        fileSize: 1024 * 1024 * 5  //5MB
    }
})

const singleAvatar = multerUpload.single("avatar");

//to upload multiple files we use array method and max count of files is 10
const attachmentsMulter = multerUpload.array("files" , 10);


export default singleAvatar;
export {attachmentsMulter};