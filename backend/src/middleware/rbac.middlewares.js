const hasPermission = (accessedBy)=>{
    return (req,res,next)=>{
        try{
            const user = req.authUser || null;
            if(!user){
                throw({status:401, message:"Please login 1st."})   
            }
            if(
                (typeof accessedBy === 'string' && accessedBy === user.role)
                || 
                (Array.isArray(accessedBy) && accessedBy.includes(user.role))
             ){
                next()

            }else{
                throw{status:403, message:"You do not have access to this resource"}
            }
            
        }catch(exception){
            next(exception)     
        }
        
    }
}


module.exports = hasPermission