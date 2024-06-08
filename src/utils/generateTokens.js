export const generateOTP = () =>{
    const max = 999999
    const min = 100000

    return Math.floor(Math.random()*(max-min+1)+min).toString();
}

export const generateVerificationToken = (length) =>{
    const charsString = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890";
    
    let token = "";
    for(let i=0;i<length;i++){
        token += charsString[Math.floor(Math.random()*charsString.length)];
    }

    return token

}