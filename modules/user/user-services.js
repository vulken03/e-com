const { constants } = require("../../utils/constant");
const common = require("../../utils/common");
const user_data = require("./user-schema");
const user_model = require("./user-model");
const { decryptRequestData } = require("../../utils/encrypt");
//const log_in=require('./todo-model')

const signup = async (req, res, next) => {
  let user = decryptRequestData(req.body.data);

  console.log("data", user);

  try {
    const { isValid, error } = common.schemaValidator(
      user,
      user_data.newUserSchema
    );

    if (!isValid) {
      return next(error);
    }

    const user_value = await user_model.user_register(user);
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      user_value,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  let user = decryptRequestData(req.body.data);
  //let userid=req.user.id
  //task(userid,user)
  try {
    const { isValid, error } = common.schemaValidator(
      user,
      user_data.newLoginSchema
    );
    if (!isValid) {
      return next(error);
    }
    //   await user_model
    //     .login(user)
    //     .then(({ isSuccessful, token }) => {
    //       if (isSuccessful) {
    //         res.status(constants.responseCodes.success).json({
    //           message: constants.responseMessage.success,
    //           token,
    //         });
    //       } else {
    //         const err = new Error(constants.errors.invalidLogin);
    //         next(err);
    //       }
    //     })
    //     .catch((err) => {
    //       console.log("error", err);
    //       next(err);
    //     });
    // } catch (error) {
    //   console.log("err", error);
    //   res.status(constants.responseCodes.success).json({
    //     message: error,
    //   });
    // }
    const loginUser = await user_model.login(user);
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      loginUser,
    });
  } catch (err) {
    next(err);
  }
};
const logout = async (req, res, next) => {
  try {
    const uuid = req.user.uuid;
    const isLogout = await user_model.logout(uuid);
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      isLogout,
    });
  } catch (err) {
    next(err);
  }
};

const passwordResetMail = async (req, res, next) => {
  try {
    let user = req.body;
    const resetPassword = await user_model.passwordResetMail(user);
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      resetPassword,
    });
  } catch (err) {
    next(err);
  }
};

const passwordReset = async (req, res, next) => {
  let userid = req.user.user_id;
  let userDetails = req.body;
  try {
    const resetPassword = await user_model.passwordReset(userid, userDetails);
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      resetPassword,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  login,
  logout,
  passwordResetMail,
  passwordReset,
};
