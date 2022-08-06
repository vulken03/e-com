const constants = {
  insecureRoutes: [
    "/admin_login",
    "/admin_registration",
    "/customer_signup",
    "/customer_login",
    "/password_reset_mail",
    "/email_verification",
   
  ],
  responseCodes: {
    success: 200,
    error: 500,
    badrequest: 400,
  },
  responseMessage: {
    success: "success",
    error: "error",
  },

  errors: {
    user: "user is already exists with same username",
    invalidLogin: "Wrong username or password",
    sessionExpired: "Session Expired. Please login again",
    failedLoggingout: "Failed to logout user",
    accountDeactivated: "Account is deactivated, please contact support.",
    missingEmployeeId: "Please provide the employee id",
    missingImage: "Please provide the image",
    routeAccessDenied: "Route access denied.",
    invalidUserData: "Invalid user signup data",
    userAlreadyExist: "User is already exist with the same email address",
    companyAlreadyExist: "Company is already exist with the same name",
    companyDoesNotExist: "Company does not exist",
    failedUpdated: "Failed to updated the employee",
    invalidCompanyOrRole: "Invalid company or role id",
    invalidDeleteType: "Invalid delete type",
    invalidCompId: "Invalid Company Id",
    invalidEmployeeId: "Invalid employee id received",
    failedCompanyDelete:
      "Invalid company id or employee assigned to the company",
    invalidRoleId: "Invalid role id",
    invalidDepartmentId: "Invalid department id",
    invalidFileType: "Invalid File Type",
    failedAssignment: "Failed to assign company to the employee",
    alreadyAssigned: "employee already assigned to the company",
    failedUnassignment: "Failed to unassign company to the employee",
    AlreadyExist: "already exist with the same name",
    departmentAlreadyExist: "Department is already exist with the same name",
  },
};

module.exports = {
  constants,
};
