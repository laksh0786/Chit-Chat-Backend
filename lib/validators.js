import { body, check, param, validationResult } from 'express-validator';
import { ErrorHandler } from '../utils/errorHandler.js';

//this is a middleware function that validates the request and checks if there are any errors and if errors then throws an error
const validateErrorMessage = (req, resp, next) => {

    const errors = validationResult(req);

    const errorMessages = errors.array().map((error) => error.msg).join(', ');
    // console.log(errorMessages);

    if (errors.isEmpty()) {
        return next();
    } else {
        return next(new ErrorHandler(errorMessages, 400));
    }
}



//this is a function that returns an array of validation middlewares and different for different routes
const registerValidator = () => [
    body('name', 'Name is required').notEmpty(),
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Email is invalid'),
    body('password',)
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 4 }).withMessage('Password must be atleast 4 characters long'),
    body('bio', 'Bio is required').notEmpty()
]


//login validator
const loginValidator = () => [
    body('email', 'Email is required').isEmail(),
    body('password', 'Password is required').notEmpty(),
]


//new group chat validator
const newGroupChatValidator = () => [
    body('name', 'Name is required').notEmpty(),
    body('members')
        .notEmpty().withMessage('Members are required')
        .isArray({ min: 2, max: 100 }).withMessage('Members must be between 2 to 100'),
]


//add group members validator
const addGroupMemberValidator = () => [
    body('chatId', 'Chat Id is required').notEmpty(),
    body('members')
        .notEmpty().withMessage('Members are required')
        .isArray({ min: 1, max: 97 }).withMessage('Members must be between 1 to 97'),
]


//remove group member validator
const removeGroupMemberValidator = () => [
    body('chatId', 'Chat Id is required').notEmpty(),
    body('userId', 'Member Id is required').notEmpty(),
]



//send attachment validator
const sendAttachmentValidator = () => [
    body('chatId', 'Chat Id is required').notEmpty(),

    //req.files is not working as express validator fails to validate the files that are uploaded using multer
    // check('files')
    //     .notEmpty().withMessage('Please Upload Attachments')
    //     .isArray({ min: 1, max: 5 }).withMessage('You can upload upto 5 attachments')
]


//chat id validator
const chatIdvalidator = () => [
    param('id', 'Chat Id is required').notEmpty(),
]


//chat rename validator
const chatRenameValidator = () => [
    body('name', 'Name is required').notEmpty(),
    param('id', 'Chat Id is required').notEmpty(),
]


//send friend request validator
const sendFriendRequestValidator = () => [
    body('userId', 'User Id is required').notEmpty(),
]


//accept friend request validator
const acceptFriendRequestValidator = () => [
    body('requestId', 'Request Id is required').notEmpty(),
    body('accept')
        .notEmpty().withMessage('Accept is required')
        .isBoolean().withMessage('Accept must be a boolean value')
]


//admin login validator
const adminLoginValidator = ()=>[
    body('secretKey').notEmpty().withMessage('Secret Key is required')
]

//make admin validator
const makeAdminValidator = ()=>[
    body('userId').notEmpty().withMessage('User Id is required'),
    param('chatId').notEmpty().withMessage('Chat Id is required')
]

export {
    registerValidator,
    loginValidator,
    validateErrorMessage,
    newGroupChatValidator,
    addGroupMemberValidator,
    removeGroupMemberValidator,
    sendAttachmentValidator,
    chatIdvalidator,
    chatRenameValidator,
    sendFriendRequestValidator,
    acceptFriendRequestValidator,
    adminLoginValidator,
    makeAdminValidator
};