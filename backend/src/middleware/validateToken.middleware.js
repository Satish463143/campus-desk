
require("dotenv").config();
const jwt = require("jsonwebtoken")
const prisma = require("../config/db.config");

const verifyToken = async(req, res,next)=>{
    try{
        const authHeader = req.headers['authorization']
        if(!authHeader) throw {status:401, message:"Authroization token missing"}
        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await prisma.user.findUnique({
            where: { id: decoded.sub }
        })

        if(!user) throw {status:401, message:"Invalid or Expired token"}
        req.user = user
        next()
    }catch(exception){
        console.log('not match token',exception)
        next(exception)
    }
}   

module.exports = verifyToken
