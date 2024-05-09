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
        default:"",
    },
    coverImage:{
        type:String,
    },
    coverImagePublicId:{
        type:String,
        default:"",
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
    }
},{
    timestamps:true
})

// TODO: add public id here along with url 

userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        return next();
    }
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
        // email:this.email,
        // username:this.username,
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