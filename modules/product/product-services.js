const product_model = require("./product-model");
const { constants } = require("../../utils/constant");
const product_schema = require("./product-schema");
const common = require("../../utils/common");
const url = require("url");
const create_product_type = async (req, res, next) => {
  try {
    const data = req.body;
    const { isValid, error } = common.schemaValidator(
      data,
      product_schema.productSchema
    );
    if (!isValid) {
      return next(error);
    }
    const product_creation = await product_model.create_product_type(data);
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      product_creation,
    });
  } catch (err) {
    next(err);
  }
};

const delete_product_type = async (req, res, next) => {
  try {
    const product_type_deletion = await product_model.delete_product_type(
      req.params.product_type_id
    );
    if (product_type_deletion) {
      res.status(constants.responseCodes.success).json({
        message: constants.responseMessage.success,
        product_type_deletion,
      });
    }
  } catch (err) {
    next(err);
  }
};

// const product_type_filter= async (req, res, next) => {
//   try {
//     let Currenturl = url.parse(req.url, true);
//     const data=Currenturl.query;
//     const{category_name,brand_name}=data;
//     const product_list = await product_model.product_type_filter({category_name,brand_name});
//     res.status(constants.responseCodes.success).json({
//       message: constants.responseMessage.success,
//       product_list,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

const product_type_listing = async (req, res, next) => {
  try {
    let Currenturl = url.parse(req.url, true);
    const data=Currenturl.query;
    const{category_name,brand_name}=data;
    const product_type = await product_model.product_type_listing({category_name,brand_name});
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      product_type,
    });
  } catch (err) {
    next(err);
  }
};

const find_single_product_type = async (req, res, next) => {
  try {
    const product_type = await product_model.specific_product_type(
      req.params.product_type_id
    );
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      product_type,
    });
  } catch (err) {
    next(err);
  }
};

const update_product_type = async (req, res, next) => {
  try {
    const product_type_data = req.body;
    const product_type_id = req.params.product_type_id;
    const { isValid, error } = common.schemaValidator(
      product_type_data,
      product_schema.productSchema
    );
    if (!isValid) {
      return next(error);
    }
    const update = await product_model.update_product_type(
      product_type_id,
      product_type_data
    );
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      update,
    });
  } catch (err) {
    next(err);
  }
};

const add_product_specification = async (req, res, next) => {
  try {
    const data = req.body;
    const { isValid, error } = common.schemaValidator(
      data,
      product_schema.create_specification_schema
    );
    if (!isValid) {
      return next(error);
    }

    const add_specifications =
      await product_model.create_product_data(data);
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      add_specifications,
    });
  } catch (err) {
    next(err);
  }
};

const product_listing = async (req, res, next) => {
  try {
    let Currenturl = url.parse(req.url, true);
    const data = Currenturl.query;
    const filters = req.body || {};
    // const { isValid, error } = common.schemaValidator(
    //   data,
    //   product_attributes_schema.get_product_schema
    // );
    // if (!isValid) {
    //   return next(error);
    // }
    const all_products = await product_model.product_listing(
      data,
      filters
    );
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      all_products,
    });
  } catch (err) {
    next(err);
  }
};

const specific_product_listing = async (req, res, next) => {
  try {
    const specific_product =
      await product_model.specific_product_listing(
        req.params.product_id
      );
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      specific_product,
    });
  } catch (err) {
    next(err);
  }
};

const delete_product = async (req, res, next) => {
  try {
    const product_deletion = await product_model.delete_product(
      req.params.product_id
    );
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      product_deletion,
    });
  } catch (err) {
    next(err);
  }
};

const update_product = async (req, res, next) => {
  try {
    const data = req.body;
    const product_id = req.params.product_id;
    const { isValid, error } = common.schemaValidator(
      data,
      product_schema.create_specification_schema
    );
    if (!isValid) {
      return next(error);
    }

    const product_updation = await product_model.update_product(
      product_id,
      data
    );
    res.status(constants.responseCodes.success).json({
      message: constants.responseMessage.success,
      product_updation,
    });
  } catch (err) {
    next(err);
  }
};
module.exports = {
  create_product_type,
  delete_product_type,
  product_type_listing,
  find_single_product_type,
  update_product_type,
  add_product_specification,
  product_listing,
  specific_product_listing,
  delete_product,
  update_product,
};
