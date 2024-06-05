export const generateOTP = (max = 999999,min = 100000) =>{
    // max = 999999
    // min = 100000

    return Math.floor(Math.random()*(max-min+1)+min).toString();
}