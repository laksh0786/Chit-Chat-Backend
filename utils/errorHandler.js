//creating errorHandler class which is child of Error class


// Error Handler Class
class ErrorHandler extends Error {
    constructor(message , statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

//ErrorHandler extends Error is used to inherit the properties of Error class to ErrorHandler class

//constructor(message , statusCode) is a constructor of the class which takes two parameters message and statusCode

//super is used to call the parent class constructor and pass the message
//this.statusCode is used to set the status code of the error


// const errorExample = new ErrorHandler("This is an error message" , 404);
// console.log(errorExample.message , errorExample.statusCode); //This is an error message

//exporting the ErrorHandler class
export {ErrorHandler};