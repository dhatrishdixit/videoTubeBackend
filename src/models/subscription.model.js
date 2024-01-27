import mongoose from "mongoose";

const subscriptionSchema =  new mongoose.Schema({
    subscriber:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
        // for user who is subscribed
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
        // channel which also related to user 
    }
},{
    timestamps:true
})



export const Subscription =mongoose.model("Subscription",subscriptionSchema);