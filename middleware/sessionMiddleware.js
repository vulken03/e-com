const jwt = require("jsonwebtoken");
const { constants } = require("../utils/constant");
const moment = require("moment");
const config = require("../configuration/config");
const { logger } = require("../utils/logger");
const url = require('url');
const verifyJWT = async ({ token, url }) => {
  try {
    let userData = null;
    if (url == "/resetpassword") {
      userData = jwt.verify(token, config.get("jwt.reset_password_key"), {
        algorithm: ["HS384"], expiresIn: "1h"
      });
    }
    // else if (url == "/email_verify") {
    //   userData = jwt.verify(params, config.get("jwt.verification_email_key"), {
    //     algorithm: ["HS384"],expiresIn: "1h"
    //   });
    // } 
    else {
      userData = jwt.verify(token, config.get("jwt.key"), {
        algorithms: ["HS384"],
      });
    }
    if (userData) {
      return userData;
    } else {
      return false;
    }
  } catch (err) {
    throw err;
  }
};

let isValidSession = async (uuid) => {
  try {
    let isValid = false;
    const userSession = await _DB.session.findOne({
      where: {
        uuid,
      },
      attributes: ["time_to_leave", "is_loggedout", "uuid"],
      raw: true,
    });

    if (userSession) {
      const timeToLeave = moment.unix(userSession.time_to_leave);
      const isExpired = moment().isAfter(timeToLeave);

      if (!isExpired && !userSession.is_loggedout) {
        isValid = true;
      }

      if (isExpired) {
        await _DB.session.update(
          { is_loggedout: 1 },
          {
            fields: ["is_loggedout"],
          }
        );
      }
    }

    return isValid;
  } catch (err) {
    logger.error(err);
    return false;
  }
};

let isValidUser = async ({ isAdmin, userId }) => {
  try {
    let isUserValid = false;
    let fetchedUser = null;
    if (isAdmin == 1) {
      fetchedUser = await _DB.admin.findOne({
        where: {
          admin_id: userId,
        },
        attributes: ["admin_id", "username", "email"],
        raw: true,
      });
    } else {
      fetchedUser = await _DB.customer.findOne({
        where: {
          customer_id: userId,
        },
        attributes: ["customer_id", "username", "email"],
        raw: true,
      });
    }
    if (fetchedUser) {
      isUserValid = true;
    }
    return {
      isUserValid,
      user: fetchedUser,
    };
  } catch (err) {
    logger.error(err);
    return false;
  }
};

let authenticateRequest = async (req, res, next) => {
  try {
    let q = url.parse(req.url, true)
    if (constants.insecureRoutes.includes(req.url)) {
      return next();
    } else if (q.pathname == "/email_verify") {
      return next();
    } else {



      if (req.headers.authorization) {

        const userData = await verifyJWT({
          token: req.headers.authorization,
          url: req.url,

        });

        const isSessionValid = await isValidSession(userData.uuid);
        if (!isSessionValid) {
          const error = new Error(constants.errors.isExpired);
          return next(error);
        }

        const { isUserValid, user } = await isValidUser(userData);
        if (isUserValid) {
          console.log(user);
          req.user = user; // C-TODO: exclude password field from user object
          req.user.uuid = userData.uuid;
          req.isAdmin = userData.isAdmin;
          next();
        } else {
          next(new Error("Invalid user id"));
        }
      } else {
        next(new Error("Invalid authorization"));
      }
    }
  } catch (error) {
    logger.error("error", error);
    next(error);
  }
};

module.exports = {
  authenticateRequest,
};
