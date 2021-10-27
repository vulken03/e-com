const admin = require("./admin-services");
const { allowAdminOnly } = require("../../utils/common");
module.exports = (app) => {
  app.post("/admin_login", admin.admin_login);
  app.post("/admin_registration", admin.admin_registration);
  app.post("/admin_logout",allowAdminOnly,admin.admin_logout);
};
