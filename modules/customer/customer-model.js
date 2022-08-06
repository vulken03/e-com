const { sendEmail } = require("../../utils/common");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const config = require("../../configuration/config");
const { validatePassword } = require("../../utils/encrypt");
const { logger } = require("../../utils/logger");
const signup = async (userData) => {
  const transaction = await _DB.sequelize.transaction();
  try {
    const find_customer = await _DB.customer.findOne({
      where: {
        username: userData.username,
      },
      attributes: ["customer_id", "username"],
    });
    if (find_customer) {
      error_message = "customer is already created with given username";
      return {
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
    } else {
      const {
        name,
        username,
        email,
        phoneno,
        password,
        street,
        city,
        pincode,
        state,
        country,
      } = userData;
      const create_customer = await _DB.customer.create(
        {
          name,
          username,
          email,
          phoneno,
          password,
        },
        {
          transaction,
          fields: [
            "customer_id",
            "name",
            "username",
            "email",
            "phoneno",
            "password",
          ],
        }
      );
      if (create_customer) {
        const create_address = await _DB.customer_address.create(
          {
            street,
            city,
            pincode,
            state,
            country,
            is_default: 1,
            customer_id: create_customer.customer_id,
          },
          {
            transaction,
            fields: [
              "street",
              "city",
              "pincode",
              "state",
              "country",
              "is_default",
              "customer_id",
            ],
          }
        );
        if (create_address) {
          const session = await createVerificationSession(
            create_customer.customer_id
          );
          if (session) {
            const token = await generateVerificationJwt(
              create_customer,
              session
            );
            if (token) {
              const create_token = await _DB.verification_token.create(
                {
                  customer_id: create_customer.customer_id,
                  date: new Date(),
                },
                { transaction, fields: ["customer_id", "token", "date"] }
              );
              if (create_token) {
                await transaction.commit();
                await sendEmail({
                  to: create_customer.email,
                  subject: "account verification",
                  html: `<h3>http://localhost:8080/email_verify?token=${token}</h3>`,
                });

                return {
                  success: true,
                  data: token,
                  message:
                    "signup successfully check mail for email verification...",
                };
              } else {
                await transaction.rollback();
                const error_message =
                  "error while creating token for email verification...";
                return {
                  success: false,
                  data: null,
                  error: new Error(error_message).stack,
                  message: error_message,
                };
              }
            } else {
              await transaction.rollback();
              const error_message =
                "error while generating jwt token for email verification";
              return {
                success: false,
                data: null,
                error: new Error(error_message).stack,
                message: error_message,
              };
            }
          } else {
            await transaction.rollback();
            const error_message =
              "error while creating email verification session";
            return {
              success: false,
              data: null,
              error: new Error(error_message).stack,
              message: error_message,
            };
          }
        } else {
          await transaction.rollback();
          const error_message = "error while creating address...";
          return {
            success: false,
            data: null,
            error: new Error(error_message).stack,
            message: error_message,
          };
        }
      } else {
        await transaction.rollback();
        const error_message = "error while creating customer...";
        return {
          success: false,
          data: null,
          error: new Error(error_message).stack,
          message: error_message,
        };
      }
    }
  } catch (err) {
    await transaction.rollback();
    logger.error(err);
    return {
      success: false,
      data: null,
      error: new Error(err).stack,
      message: err,
    };
  }
};

const generateVerificationJwt = async (user, session) => {
  const uuid = session.uuid;
  const userId = user.customer_id;
  const email = user.email;
  const isAdmin = 0;
  const token = jwt.sign(
    {
      uuid,
      userId,
      email,
      isAdmin,
    },
    config.get("jwt.verification_email_key"),
    { expiresIn: "1h", algorithm: "HS384" }
  );
  if (token) {
    return token;
  } else {
    return false;
  }
};

const createVerificationSession = async (customer_id) => {
  const user_id = customer_id;
  const session = await _DB.session.create(
    {
      user_id,
      login_time: +moment().unix(),
      time_to_leave: +moment().add(1, "hours").unix(),
      is_loggedout: 0,
      is_admin: 0,
    },
    {
      fields: [
        "user_id",
        "login_time",
        "time_to_leave",
        "is_loggedout",
        "is_admin",
      ],
    }
  );
  if (session) {
    return session;
  } else {
    return false;
  }
};

const verify_email = async (customer_id) => {
  const find_data=await _DB.customer.findOne({
    where:{
      customer_id
    }
  })  
    if(find_data){
    const verification_update = await find_data.update(
      {
        is_verified: 1,
      },
      {
        fields: ["is_verified"],
      }
    );
    // C-TODO once user is verified delete all its token from verification_token table
    // C-TODO while generating token, store token creation datetime.
    if (verification_update) {
      // await _DB.verification_token.destroy({
      //   where: {
      //     customer_id,
      //   },
      // });
      return {
        success: true,
        data: null,
        message: "email_id verified",
      };
    } else {
      const error_message = "error while updating verification status..";
      return {
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
    }
  }else{
    const error_message = "error while updating verification status..";
      return {
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
  } 
  
};

const email_verification = async (email) => {
  const find_user = await _DB.customer.findOne({
    where: {
      email,
    },
    attributes: [
      "customer_id",
      "name",
      "username",
      "email",
      "phoneno",
      "is_verified",
    ],
    raw: true,
  });

  if (find_user) {
    if (find_user.is_verified == false) {
      const session = await createVerificationSession(find_user.customer_id);
      if (session) {
        const token = await generateVerificationJwt(find_user, session);
        if (token) {
          const create_token = await _DB.verification_token.create(
            {
              customer_id: find_user.customer_id,
              date: new Date(),
            },
            { fields: ["customer_id", "token", "date"] }
          );
          if (create_token) {
            await sendEmail({
              to: find_user.email,
              subject: "account verification",
              html: `<h3>${create_token.token}</h3>`,
            });
            return {
              success: true,
              data: token,
              message: "check email for email verification...",
            };
          } else {
            const error_message =
              "error while creating token for email verification...";
            return {
              success: false,
              data: null,
              error: new Error(error_message).stack,
              message: error_message,
            };
          }
        } else {
          const error_message =
            "error while generating jwt token for email verification";
          return {
            success: false,
            data: null,
            error: new Error(error_message).stack,
            message: error_message,
          };
        }
      } else {
        const error_message = "error while creating email verification session";
        return {
          success: false,
          data: null,
          error: new Error(error_message).stack,
          message: error_message,
        };
      }
    } else {
      const error_message = "email is already verified";
      return {
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
    }
  } else {
    const error_message = "user not found with given email-id";
    return {
      success: false,
      data: null,
      error: new Error(error_message).stack,
      message: error_message,
    };
  }
};

const createSession = async ({ customer_id }) => {
  try {
    const userId = customer_id;

    const session = await _DB.session.create(
      {
        user_id: userId,
        login_time: +moment().unix(),
        time_to_leave: +moment().add(1, "days").unix(),
        is_loggedout: 0,
        is_admin: 0,
      },
      {
        fields: [
          "user_id",
          "login_time",
          "time_to_leave",
          "is_loggedout",
          "is_admin",
        ],
      }
    );
    if (session) {
      return session;
    } else {
      return false;
    }
  } catch (err) {
    logger.error(err);
    return false;
  }
};

const generateJwtToken = async (users, uuid, isAdmin) => {
  try {
    const { username, admin_id, customer_id } = users;
    const userId = isAdmin == 1 ? admin_id : customer_id;
    const token = jwt.sign(
      {
        uuid,
        userId,
        username,
        isAdmin,
      },
      config.get("jwt.key"),
      {
        expiresIn: "24h",
        algorithm: "HS384",
      }
    );
    if (token) {
      return token;
    } else {
      return false;
    }
  } catch (err) {
    logger.error(err);
    return false;
  }
};

const login = async ({ email, password }) => {
  const users = await _DB.customer.findOne({
    where: {
      email,
    },
    attributes: ["username", "customer_id", "email", "password", "is_verified"],
    raw: true,
  });

  if (users) {
    if (users.is_verified) {
      const isValidate = validatePassword(
        password,
        users.password.split(":")[1],
        users.password.split(":")[0]
      );
      if (isValidate) {
        const session = await createSession(users);
        if (session) {
          const jwt = await generateJwtToken(
            users,
            session.uuid,
            session.is_admin
          );
          if (jwt) {
            return {
              success: true,
              data: jwt,
              message: "login successfully...",
            };
          } else {
            const error_message = "error while generating jwt";
            return {
              success: false,
              data: null,
              error: new Error(error_message).stack,
              message: error_message,
            };
          }
        } else {
          const error_message = "error while creating session";
          return {
            success: false,
            data: null,
            error: new Error(error_message).stack,
            message: error_message,
          };
        }
      } else {
        const error_message = "you entered wrong password";
        return {
          success: false,
          data: null,
          error: new Error(error_message).stack,
          message: error_message,
        };
      }
    } else {
      const error_message = "email is not verified";
      return {
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
    }
  } else {
    const error_message = "user not found with this email_id";
    return {
      success: false,
      data: null,
      error: new Error(error_message).stack,
      message: error_message,
    };
  }
};

const update_profile = async ({
  customer_data,
  customer_id,
  customer_params_id,
}) => {
  const { name, username, email, phoneno } = customer_data;
  const find_customer_data = await _DB.customer.findOne({
    where: {
      customer_id: customer_params_id,
    },
    attributes: ["customer_id"],
  });
  if (find_customer_data) {
    if (find_customer_data.customer_id === customer_id) {
      const update_profile = await find_customer_data.update(
        {
          name,
          username,
          email,
          phoneno,
        },
        {
          fields: ["name", "username", "email", "phoneno"],
        }
      );
      if (update_profile) {
        return {
          success: true,
          data: null,
          message: "profile updated successfully...",
        };
      } else {
        const error_message = "error while updating..";
        return {
          success: false,
          data: null,
          error: new Error(error_message).stack,
          message: error_message,
        };
      }
    } else {
      const error_message = "you can't update data with given customer_id";
      return {
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
    }
  } else {
    const error_message = "customer is npt found with given customer_id";
    return {
      success: false,
      data: null,
      error: new Error(error_message).stack,
      message: error_message,
    };
  }
};

const update_password = async (
  password_details,
  customer_id,
  customer_params_id
) => {
  const { old_password, new_password } = password_details;
  const find_customer_data = await _DB.customer.findOne({
    where: {
      customer_id: customer_params_id,
    },
    attributes: ["customer_id", "password"],
  });

  if (find_customer_data.customer_id === customer_id) {
    const isValidate = validatePassword(
      old_password,
      find_customer_data.password.split(":")[1],
      find_customer_data.password.split(":")[0]
    );

    if (isValidate) {
      const password_update = await find_customer_data.update(
        {
          password: new_password,
        },
        { fields: ["password"] }
      );
      if (password_update) {
        return {
          success: true,
          data: null,
          message: "password updated successfully...",
        };
      } else {
        const error_message = "error while updating..";
        return {
          success: false,
          data: null,
          error: new Error(error_message).stack,
          message: error_message,
        };
      }
    } else {
      const error_message = "your old_password is wrong";
      return {
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
    }
  } else {
    const error_message = "you can't update password with given customer_id";
    return {
      success: false,
      data: null,
      error: new Error(error_message).stack,
      message: error_message,
    };
  }
};

const generatePasswordResetJwt = async (user, session) => {
  const uuid = session.uuid;
  const userId = user.customer_id;
  const email = user.email;
  const isAdmin = 0;
  const token = jwt.sign(
    {
      uuid,
      userId,
      email,
      isAdmin,
    },
    config.get("jwt.reset_password_key"), //C-TODO: read this from config
    { expiresIn: "1h", algorithm: "HS384" }
  );
  if (token) {
    return token;
  } else {
    return false;
  }
};

const createPasswordResetSession = async (customer_id) => {
  const user_id = customer_id;
  const session = await _DB.session.create(
    {
      user_id,
      login_time: +moment().unix(),
      time_to_leave: +moment().add(1, "hours").unix(),
      is_loggedout: 0,
      is_admin: 0,
    },
    {
      fields: [
        "user_id",
        "login_time",
        "time_to_leave",
        "is_loggedout",
        "is_admin",
      ],
    }
  );
  if (session) {
    return session;
  } else {
    return false;
  }
};

const sendPasswordResetMail = async (data) => {
  const User = await _DB.customer.findOne({
    where: {
      email: data.email,
    },
    attributes: ["customer_id", "username", "email"],
    raw: true,
  });
  if (User) {
    const session = await createPasswordResetSession(User.customer_id);
    if (session) {
      const token = await generatePasswordResetJwt(User, session);
      if (token) {
        await sendEmail({
          to: User.email,
          subject: "Password Reset",
          html: `<h5>Please use below token to reset your password</h5><br/><h3>${token}</h3>`,
        });
        return {
          success: true,
          data: null,
          message: "check mail for reset password.",
        };
      } else {
        const error_message = "error while generating token...";
        return {
          success: false,
          data: null,
          error: new Error(error_message).stack,
          message: error_message,
        };
      }
    } else {
      const error_message = "error while generating session...";
      return {
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
    }
  } else {
    const error_message = "user not found with given email_id";
    return {
      success: false,
      data: null,
      error: new Error(error_message).stack,
      message: error_message,
    };
  }
};

const reset_password = async (customer_id, password) => {
  const find_user = await _DB.customer.findOne({
    where: {
      customer_id,
    },
    attributes: ["customer_id"],
  });
  if (find_user) {
    const password_reset = await find_user.update(
      {
        password,
      },
      {
        fields: ["password"],
      }
    );
    if (password_reset) {
      //C-TODO: after password reset kill the session by turning is_loggedout to 1
      await _DB.session.update(
        {
          is_loggedout: 1,
        },
        {
          where: {
            user_id: customer_id,
          },
          fields: ["is_loggedout"],
        }
      );

      return {
        success: true,
        data: null,
        message: "password changed successfully...",
      };
    } else {
      const error_message = "error while reset password..";
      return {
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
    }
  } else {
    const error_message = "user not found with given email";
    return {
      success: false,
      data: null,
      error: new Error(error_message).stack,
      message: error_message,
    };
  }
};

const address_manage = async (customer_id, addressData) => {
  const { street, city, pincode, state, country } = addressData;
  const find_customer = await _DB.customer.findOne({
    where: {
      customer_id,
    },
    attributes: ["customer_id"],
    raw: true,
  });
  if (find_customer) {
    const add_address = await _DB.customer_address.create(
      {
        street,
        city,
        pincode,
        state,
        country,
        is_default: 0,
        customer_id: find_customer.customer_id,
      },
      {
        fields: [
          "street",
          "city",
          "pincode",
          "state",
          "country",
          "is_default",
          "customer_id",
        ],
      }
    );
    if (add_address) {
      return {
        success: true,
        data: null,
        message: "new address added successfully...",
      };
    } else {
      const error_message = "error while creating address..";
      return {
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
    }
  }
};

const delete_address = async (address_id, customer_id) => {
  const find_address = await _DB.customer_address.findOne({
    where: {
      address_id,
    },
    attributes: ["address_id", "is_default", "customer_id"],
  });
  if (find_address) {
    if (
      find_address.customer_id === customer_id &&
      find_address.is_default == false
    ) {
      const address_deletion = await find_address.destroy();
      if (address_deletion) {
        return {
          success: true,
          data: null,
          message: "address deleted successfully...",
        };
      } else {
        const error_message = "error while deleting..";
        return {
          success: false,
          data: null,
          error: new Error(error_message).stack,
          message: error_message,
        };
      }
    } else {
      const error_message = "unauthorised access..";
      return {
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
    }
  } else {
    const error_message = "not find address with given address_id";
    return {
      success: false,
      data: null,
      error: new Error(error_message).stack,
      message: error_message,
    };
  }
};

const update_address = async (address_id, customer_id, address_data) => {
  const find_address = await _DB.customer_address.findOne({
    where: {
      address_id,
    },
    attributes: ["address_id", "customer_id"],
  });
  if (find_address) {
    if (find_address.customer_id === customer_id) {
      const address_updation = await find_address.update(address_data, {
        fields: ["street", "city", "pincode", "state", "country"],
      });
      if (address_updation) {
        return {
          success: true,
          data: null,
          message: "address updated successfully...",
        };
      } else {
        const error_message = "error while updating..";
        return {
          success: false,
          data: null,
          error: new Error(error_message).stack,
          message: error_message,
        };
      }
    } else {
      const error_message = "unauthorised access..";
      return {
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
    }
  } else {
    const error_message = "not find address with given address_id";
    return {
      success: false,
      data: null,
      error: new Error(error_message).stack,
      message: error_message,
    };
  }
};

const customer_logout = async (uuid) => {
  const find_session = await _DB.session.findOne({
    where: {
      uuid,
    },
    attributes: ["uuid", "is_loggedout"],
  });
  if (find_session) {
    const logout = await find_session.update(
      {
        is_loggedout: 1,
      },
      {
        fields: ["is_loggedout"],
      }
    );
    if (logout) {
      return {
        success: true,
        data: null,
        message: "logout successfully..",
      };
    } else {
      return {
        message: "error while logout..",
        success: false,
        data: null,
        error: new Error(error_message).stack,
        message: error_message,
      };
    }
  } else {
    return {
      message: "error while finding session...",
      success: false,
      data: null,
      error: new Error(error_message).stack,
      message: error_message,
    };
  }
};

const list_address_Details = async (customer_id) => {
  const list_address = await _DB.customer_address.findAll({
    where: {
      customer_id,
    },
    attributes: [
      "address_id",
      "street",
      "city",
      "pincode",
      "state",
      "country",
      "is_default",
    ],
    raw: true,
  });
  return {
    success: true,
    data: list_address,
  };
};

module.exports = {
  signup,
  verify_email,
  email_verification,
  login,
  update_profile,
  update_password,
  sendPasswordResetMail,
  reset_password,
  address_manage,
  delete_address,
  update_address,
  customer_logout,
  list_address_Details,
};
