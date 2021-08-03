const {constants}=require('./constant')
let Validator=require('jsonschema').Validator;
let v=new Validator();
const schemaValidator=(schema,schemaStructure)=>{

    let isValid=false
    let error=null
  
    const validationResult=v.validate(schema,schemaStructure)
  
    if(validationResult.valid){
      isValid=true
    }
  
    else{
  
      error=new Error(validationResult.Error)
    }
    return{
      isValid,error
    }
  }

  const allowAdminOnly=(req,res,next)=>{

  

    
    if(req.isAdmin==1){
      next()
    }
    else{
      return next(new error(constants.errors.routeAccessDenied))
    }
  }
  

  
  module.exports={
      schemaValidator,
      allowAdminOnly
  }