const customer_service = require("./customer-services");
const { allowCustomerOnly } = require("../../utils/common");
module.exports = (app) => {
  app.post("/customer_signup", customer_service.signup);
  app.post("/customer_login", customer_service.login);
  app.put(
    "/customer_profile_update/:customer_params_id",
    allowCustomerOnly,
    customer_service.update_profile
  );
  app.put(
    "/customer_password_update/:customer_params_id",
    allowCustomerOnly,
    customer_service.update_password
  );
  app.post(
    "/password_reset_mail",
    allowCustomerOnly,
    customer_service.passwordResetMail
  );
  app.put("/resetpassword", allowCustomerOnly, customer_service.password_reset);
  app.get("/email_verify", customer_service.verify_email);
  app.post(
    "/manage_address",
    allowCustomerOnly,
    customer_service.address_manage
  );
  app.delete(
    "/delete_address/:address_id",
    allowCustomerOnly,
    customer_service.delete_address
  );
  app.put(
    "/update_address/:address_id",
    allowCustomerOnly,
    customer_service.update_address
  );
  app.post(
    "/customer_logout",
    allowCustomerOnly,
    customer_service.customer_logout
  );
  app.post("/email_verification", customer_service.email_verification);
  app.get(
    "/list_address_details",
    allowCustomerOnly,
    customer_service.list_address_Details
  );
};
//C-TODO Create API for Generating a new customer verification token if the account is not yet verified - this is cus if user loses its inital token then he can generate a new verification token to verify its account. Token should expire after 1 hr.
// C-TODO Also, when you are generating verification token initially while registration then it should be valid for 1 hr only so create session token and to handle the expiry.
