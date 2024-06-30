import mongoose from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        lowercase:true
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,
        required:true
    },
    avatarPublicId:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String,
    },
    coverImagePublicId:{
        type:String,
    },
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Video'
        }
    ],
    password:{
        type:String,
        required:[true,'Password is required']
    },
    refreshToken:{
        type:String
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    verifyEmailToken:{
        type:String,
    },
    verifyEmailTokenExpiry:{
        type:Date,
    },
    forgotPasswordToken:{
        type:String,
    },
    forgotPasswordTokenExpiry:{
        type:Date,
    },
    resetPasswordAccess:{
        type:String,
    }
    // googleId:{
    //     type:String,
    // }
    //TODO: have forgot password access 
},{
    timestamps:true
})


userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        return next();
    }
    //console.log(this.isModified('password'));
    this.password = await bcrypt.hash(this.password,10);
    return next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    
try {
    
    return await bcrypt.compare(password,this.password)
} catch (error) {
   console.log("error :",error)
}
}
userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        id:this._id  
    },
    process.env.REFRESH_TOKEN_SECRET
    )
}

export const User = mongoose.model('User',userSchema);