const asyncHandler = (requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    }
}

export {asyncHandler}



//this is a higher order function that takes functions as arugumnets and return function
//method :-1
/*
const asyncHandler = (fn) => async( req ,res, next) =>{
    try {
        await fn(req, res , next)
    } catch (error) {
         res.status(error.code || 500).json({
            sucess:false,
            message : error.message
         })
    }
}
    */