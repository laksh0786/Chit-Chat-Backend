export const  cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,  //this is the max age of the cookie i.e 15 days
    sameSite: 'none', //this is for cross site cookies this means that the cookie can be sent in cross site requests
    httpOnly: true,   //this means that the cookie can only be accessed by the server
    secure: true,  //this means that the cookie can only be sent over https
}