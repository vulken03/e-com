const url = require("url");
const jwt = require("jsonwebtoken");
const customer_model = require("./customer-model");
const { constants } = require("../../utils/constant");
const customer_schema = require("./customer-schema");
const config = require("../../configuration/config");
const { decryptRequestData } = require("../../utils/encrypt");
const common = require("../../utils/common");
//const { logger } = require("../../utils/logger");
const signup = async (req, res, next) => {
  try {
    const data = req.body;
    const { isValid, error } = common.schemaValidator(
      data,
      customer_schema.signupSchema
    );
    if (!isValid) {
      return next(error);
    }
    
    const customer_signup = await customer_model.signup(data);

    if (customer_signup.success === true) {
      res.status(constants.responseCodes.success).json({
        success: customer_signup.success,
        data: customer_signup.data,
        message: customer_signup.message,
      });
    } else {
      res.status(constants.responseCodes.badrequest).json({
        success: customer_signup.success,
        data: customer_signup.data,
        error: customer_signup.error,
        message: customer_signup.message,
      });
    }
  } catch (err) {
    next(err);
    logger.error(err);
  }
};

const login = async (req, res, next) => {
  //console.log('admin',admin_data);

  try {
    const customer_data = decryptRequestData(req.body.data);
    const { isValid, error } = common.schemaValidator(
      customer_data,
      customer_schema.loginSchema
    );
    if (!isValid) {
      return next(error);
    }
    const login = await customer_model.login(customer_data);
    if (login.success === true) {
      res.status(constants.responseCodes.success).json({
        success: login.success,
        data: login.data,
        message: login.message,
      });
    } else {
      res.status(constants.responseCodes.badrequest).json({
        success: login.success,
        data: login.data,
        error: login.error,
        message: login.message,
      });
    }
  } catch (err) {
    next(err);
    logger.error(err);
  }
};

const update_profile = async (req, res, next) => {
  try {
    const data = req.body;
    const customer_id = req.user.customer_id;
    const customer_params_id = req.params.customer_params_id;
    const { isValid, error } = common.schemaValidator(
      data,
      customer_schema.profile_update_schema
    );
    if (!isValid) {
      return next(error);
    }
    const update_profile_data = await customer_model.update_profile({
      customer_data: data,
      customer_id,
      customer_params_id,
    });

    if (update_profile_data.success === true) {
      res.status(constants.responseCodes.success).json({
        success: update_profile_data.success,
        data: update_profile_data.data,
        message: update_profile_data.message,
      });
    } else {
      res.status(constants.responseCodes.badrequest).json({
        success: update_profile_data.success,
        data: update_profile_data.data,
        error: update_profile_data.error,
        message: update_profile_data.message,
      });
    }
  } catch (err) {
    next(err);
    logger.error(err);
  }
};

const update_password = async (req, res, next) => {
  try {
    const data = req.body;
    const customer_id = req.user.customer_id;
    const customer_params_id = req.params.customer_params_id;
    const { isValid, error } = common.schemaValidator(
      data,
      customer_schema.update_password_schema
    );
    if (!isValid) {
      return next(error);
    }
    const update_password_data = await customer_model.update_password(
      data,
      customer_id,
      customer_params_id
    );

    if (update_password_data.success === true) {
      res.status(constants.responseCodes.success).json({
        success: update_password_data.success,
        data: update_password_data.data,
        message: update_password_data.message,
      });
    } else {
      res.status(constants.responseCodes.badrequest).json({
        success: update_password_data.success,
        data: update_password_data.data,
        error: update_password_data.error,
        message: update_password_data.message,
      });
    }
  } catch (err) {
    next(err);
    logger.error(err);
  }
};

const passwordResetMail = async (req, res, next) => {
  try {
    const user = req.body;
    const { isValid, error } = common.schemaValidator(
      user,
      customer_schema.password_reset_mail_schema
    );
    if (!isValid) {
      return next(error);
    }
    const resetPassword = await customer_model.sendPasswordResetMail(user);
    if (resetPassword.success === true) {
      res.status(constants.responseCodes.success).json({
        success: resetPassword.success,
        data: resetPassword.data,
        message: resetPassword.message,
      });
    } else {
      res.status(constants.responseCodes.badrequest).json({
        success: resetPassword.success,
        data: resetPassword.data,
        error: resetPassword.error,
        message: resetPassword.message,
      });
    }
  } catch (err) {
    next(err);
  }
};

const password_reset = async (req, res, next) => {
  try {
    const user = req.body;
    const customer_id = req.user.customer_id;
    const { isValid, error } = common.schemaValidator(
      user,
      customer_schema.password_reset_schema
    );
    if (!isValid) {
      return next(error);
    }
    const resetPassword = await customer_model.reset_password(
      customer_id,
      user.password
    );
    if (resetPassword.success === true) {
      res.status(constants.responseCodes.success).json({
        success: resetPassword.success,
        data: resetPassword.data,
        message: resetPassword.message,
      });
    } else {
      res.status(constants.responseCodes.badrequest).json({
        success: resetPassword.success,
        data: resetPassword.data,
        error: resetPassword.error,
        message: resetPassword.message,
      });
    }
  } catch (err) {
    next(err);
  }
};

const verify_email = async (req, res, next) => {
  try {
    
   // const customer_id = req.user.customer_id;
    // const { isValid, error } = common.schemaValidator(
    //   token,
    //   customer_schema.verify_token_schema
    // );
    // if (!isValid) {
    //   return next(error);
    // }
    const q=url.parse(req.url,true)
    const data=q.query
    console.log(data)
    const token=jwt.verify(data.token,config.get("jwt.verification_email_key"),
    { algorithms:["HS384"] })
    const customer_id=token.userId
    const email_verification = await customer_model.verify_email(
      customer_id
    );
    if (email_verification.success === true) {
      res.status(constants.responseCodes.success).json({
        success: email_verification.success,
        data: email_verification.data,
        message: email_verification.message,
      });
    } else {
     // console.log('a')
      res.status(constants.responseCodes.badrequest).json({
        success: email_verification.success,
        data: email_verification.data,
        error: email_verification.error,
        message: email_verification.message,
      });
    }
  } catch (err) {
    console.log(err)
    if(err.name="TokenExpiredError"){
     next('email verification link expired')
    }else{
    next(err);
    }
  }
};

const address_manage = async (req, res, next) => {
  try {
    const address = req.body;
    const customer_id = req.user.customer_id;
    const { isValid, error } = common.schemaValidator(
      address,
      customer_schema.manage_address_schema
    );
    if (!isValid) {
      return next(error);
    }
    const manage_address = await customer_model.address_manage(
      customer_id,
      address
    );
    if (manage_address.success === true) {
      res.status(constants.responseCodes.success).json({
        success: manage_address.success,
        data: manage_address.data,
        message: manage_address.message,
      });
    } else {
      res.status(constants.responseCodes.badrequest).json({
        success: manage_address.success,
        data: manage_address.data,
        error: manage_address.error,
        message: manage_address.message,
      });
    }
  } catch (err) {
    next(err);
  }
};

const delete_address = async (req, res, next) => {
  try {
    const address_id = req.params.address_id;
    const customer_id = req.user.customer_id;
    const address_delete = await customer_model.delete_address(
      address_id,
      customer_id
    );
    if (address_delete.success === true) {
      res.status(constants.responseCodes.success).json({
        success: address_delete.success,
        data: address_delete.data,
        message: address_delete.message,
      });
    } else {
      res.status(constants.responseCodes.badrequest).json({
        success: address_delete.success,
        data: address_delete.data,
        error: address_delete.error,
        message: address_delete.message,
      });
    }
  } catch (err) {
    next(err);
  }
};

const update_address = async (req, res, next) => {
  try {
    const address_id = req.params.address_id;
    const customer_id = req.user.customer_id;
    const address = req.body;
    const { isValid, error } = common.schemaValidator(
      address,
      customer_schema.manage_address_schema
    );
    if (!isValid) {
      return next(error);
    }
    const address_update = await customer_model.update_address(
      address_id,
      customer_id,
      address
    );
    if (address_update.success === true) {
      res.status(constants.responseCodes.success).json({
        success: address_update.success,
        data: address_update.data,
        message: address_update.message,
      });
    } else {
      res.status(constants.responseCodes.badrequest).json({
        success: address_update.success,
        data: address_update.data,
        error: address_update.error,
        message: address_update.message,
      });
    }
  } catch (err) {
    next(err);
  }
};

const customer_logout = async (req, res, next) => {
  try {
    const uuid = req.user.uuid;
    const logout = await customer_model.customer_logout(uuid);
    if (logout.success === true) {
      res.status(constants.responseCodes.success).json({
        success: logout.success,
        data: logout.data,
        message: logout.message,
      });
    } else {
      res.status(constants.responseCodes.badrequest).json({
        success: logout.success,
        data: logout.data,
        error: logout.error,
        message: logout.message,
      });
    }
  } catch (err) {
    next(err);
  }
};

const email_verification = async (req, res, next) => {
  try {
    const data = req.body;
    const { email } = data;
    const { isValid, error } = common.schemaValidator(
      data,
      customer_schema.verify_schema
    );
    if (!isValid) {
      return next(error);
    }
    const email_verify = await customer_model.email_verification(email);
    if (email_verify.success === true) {
      res.status(constants.responseCodes.success).json({
        success: email_verify.success,
        data: email_verify.data,
        message: email_verify.message,
      });
    } else {
      res.status(constants.responseCodes.badrequest).json({
        success: email_verify.success,
        data: email_verify.data,
        error: email_verify.error,
        message: email_verify.message,
      });
    }
  } catch (err) {
    next(err);
  }
};

const list_address_Details = async (req, res, next) => {
  try {
    const customer_id = req.user.customer_id;
    const list_address = await customer_model.list_address_Details(customer_id);
    res.status(constants.responseCodes.success).json({
      success: list_address.success,
      data: list_address.data,
      message: list_address.message,
    });
  } catch (err) {
    next(err);
  }
};
module.exports = {
  signup,
  login,
  update_profile,
  update_password,
  passwordResetMail,
  password_reset,
  verify_email,
  address_manage,
  delete_address,
  update_address,
  email_verification,
  customer_logout,
  list_address_Details,
};
