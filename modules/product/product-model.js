const sequelize = require("sequelize");
const { Op } = require("sequelize");
const helper = require("../../utils/helper");
const create_product_type = async (productData) => {
  const transaction = await _DB.sequelize.transaction();
  try {
    const { product_type_name, product_category_list, product_brand_list } =
      productData;

    const find_product_type = await _DB.product_type.findOne({
      where: {
        product_type_name,
      },
    });
    if (find_product_type) {
      return {
        success: false,
        data: null,
        error: new Error(
          "product_type is already created with give product_type_name"
        ),
        message: "product_type is already created with give product_type_name",
      };
    }

    const create_product_type = await _DB.product_type.create(
      {
        product_type_name,
      },
      { transaction }
    );
    if (create_product_type) {
      const category = await create_category(
        create_product_type,
        product_category_list,
        {
          transaction,
        }
      );
      const brand = await create_brand(
        create_product_type,
        product_brand_list,
        {
          transaction,
        }
      );
      const [m1, m2] = await Promise.all([category, brand]);
      if (m1 && m2) {
        //console.log(typeof m1);
        await transaction.commit();
        return {
          success: true,
          data: create_product_type,
        };
      } else {
        return {
          success: false,
          data: null,
          error: new Error("error while creating category or brand"),
          message: "error while creating category or brand", // not required when success is true
        };
      }
    } else {
      return {
        success: false,
        data: null,
        error: new Error("error while creating product_type"),
        message: "error while creating product_type", // not required when success is true
      };
    }
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};
// { product_type_id, product_category_list, sql_tran }
const create_category = async (
  create_product_type,
  product_category_list,
  { transaction }
) => {
  let category_list = [];

  for (let i of product_category_list) {
    const check_category = await _DB.product_category.findOne({
      where: {
        category_name: i,
      },
    });
    if (check_category) {
      _DB.type_category.create(
        {
          product_type_id: create_product_type.product_type_id,
          category_id: check_category.category_id,
        },
        { transaction }
      );
    } else {
      category_list.push({
        category_name: i,
      });
    }
  }
  const create_category = await _DB.product_category.bulkCreate(category_list, {
    transaction,
  });
  let arr1 = [];
  for (let k of create_category) {
    arr1.push({
      product_type_id: create_product_type.product_type_id,
      category_id: k.category_id,
    });
  }
  await _DB.type_category.bulkCreate(arr1, { transaction });
  if (create_category) {
    return true;
  } else {
    return false;
  }
};
const create_brand = async (
  create_product_type,
  product_brand_list,
  { transaction }
) => {
  let brand_list = [];
  let arr2 = [];
  for (let j of product_brand_list) {
    const check_brand = await _DB.product_brand.findOne({
      where: {
        brand_name: j,
      },
    });
    if (check_brand) {
      await _DB.type_brand.create(
        {
          product_type_id: create_product_type.product_type_id,
          brand_id: check_brand.brand_id,
        },
        { transaction }
      );
    } else {
      brand_list.push({
        brand_name: j,
      });
    }
  }
  const create_brand = await _DB.product_brand.bulkCreate(brand_list, {
    transaction,
  });
  for (let l of create_brand) {
    arr2.push({
      product_type_id: create_product_type.product_type_id,
      brand_id: l.brand_id,
    });
  }
  await _DB.type_brand.bulkCreate(arr2, { transaction });
  if (create_brand) {
    return true;
  } else {
    return false;
  }
};

const delete_product_type = async (product_type_id) => {
  const find_product_type_attribute = await _DB.product_type_attribute.findOne({
    where: {
      product_type_id,
    },
  });

  const find_product = await _DB.product.findOne({
    where: {
      product_type_id,
    },
  });
  if (!find_product_type_attribute && !find_product) {
    const product_type_deletion = await _DB.product_type.destroy({
      where: {
        product_type_id,
      },
    });
    if (product_type_deletion) {
      return {
        success: true,
        data: null,
      };
    } else {
      return {
        success: false,
        data: null,
        error: new Error("error while deleting..."),
        message: "error while deleting...", // not required when success is true
      };
    }
  } else {
    return {
      success: false,
      data: null,
      error: new Error("attribute is found with given product_type"),
      message: "attribute is found with given product_type", // not required when success is true
    };
  }
};

const product_type_listing = async ({ category_name, brand_name }) => {
  const filter = {};

  if (category_name && !brand_name) {
    (filter.attributes = ["product_type_name"]),
      (filter.include = {
        model: _DB.product_category,
        where: {
          category_name,
        },
        attributes: [],
        through: { attributes: [] },
      }),
      (filter.raw = true);
  } else if (brand_name && !category_name) {
    (filter.attributes = ["product_type_name"]),
      (filter.include = {
        model: _DB.product_brand,
        where: {
          brand_name,
        },
        attributes: [],
        through: { attributes: [] },
      }),
      (filter.raw = true);
  } else if (category_name && brand_name) {
    (filter.attributes = ["product_type_name"]),
      (filter.include = [
        {
          model: _DB.product_category,
          where: {
            category_name,
          },
          attributes: [],
          through: { attributes: [] },
        },
        {
          model: _DB.product_brand,
          where: {
            brand_name,
          },
          attributes: [],
          through: { attributes: [] },
        },
      ]),
      (filter.raw = true);
  } else {
    (filter.attributes = [
      "product_type_name",
      [
        sequelize.fn(
          "GROUP_CONCAT",
          sequelize.literal("DISTINCT `category_name`")
        ),
        "category_list",
      ],
      [
        sequelize.fn(
          "GROUP_CONCAT",
          sequelize.literal("DISTINCT `brand_name`")
        ),
        "brand_list",
      ],
    ]),
      (filter.include = [
        {
          model: _DB.product_category,
          attributes: [],
          through: {
            attributes: [],
          },
        },
        {
          model: _DB.product_brand,
          attributes: [],
          through: {
            attributes: [],
          },
        },
      ]),
      (filter.raw = true);
    filter.group = "product_type.product_type_id";
  }
  const find_product_types = await _DB.product_type.findAll(filter);
  if (find_product_types.length >= 0) {
    return {
      success: true,
      data: find_product_types,
    };
  } else {
    return {
      success: false,
      data: null,
      error: new Error("error while finding product_type"),
      message: "error while finding product_type", // not required when success is true
    };
  }
};

// const product_type_listing=async()=>{
//   const find_product_type = await _DB.product_type.findAll({
//     attributes: ["product_type_name",
//     [
//       sequelize.fn(
//         "GROUP_CONCAT",
//         sequelize.literal("DISTINCT `category_name`")
//       ),
//       "category_list",
//     ],
//     [
//       sequelize.fn(
//         "GROUP_CONCAT",
//         sequelize.literal("DISTINCT `brand_name`")
//       ),
//       "brand_list",
//     ]
//   ],
//     include: [
//       {
//         model: _DB.product_category,
//         attributes: [],
//         through: {
//           attributes: [],
//         },
//       },
//       {
//         model: _DB.product_brand,
//         attributes: [],
//         through: {
//           attributes: [],
//         },
//       },
//     ],
//     group: "product_type.product_type_id",
//     raw: true,
//   });
//   if (find_product_type.length>=0) {
//     return find_product_type;
//   } else {
//     throw new Error("product type is not found with this product_type_id");
//   }
// }

const specific_product_type = async (product_type_id) => {
  const find_product_type = await _DB.product_type.findAll({
    where: {
      product_type_id,
    },
    attributes: [
      "product_type_name",
      [
        sequelize.fn(
          "GROUP_CONCAT",
          sequelize.literal("DISTINCT `category_name`")
        ),
        "category_list",
      ],
      [
        sequelize.fn(
          "GROUP_CONCAT",
          sequelize.literal("DISTINCT `brand_name`")
        ),
        "brand_list",
      ],
    ],
    include: [
      {
        model: _DB.product_category,
        attributes: [],
        through: {
          attributes: [],
        },
      },
      {
        model: _DB.product_brand,
        attributes: [],
        through: {
          attributes: [],
        },
      },
    ],
    group: "product_type.product_type_id",
    raw: true,
  });
  if (find_product_type.length >= 0) {
    return {
      success: true,
      data: find_product_type,
    };
  } else {
    return {
      success: false,
      data: null,
      error: new Error(
        "error while find product_type with given product_type_id"
      ),
      message: "error while find product_type with given product_type_id",
    };
  }
};

const update_product_type = async (product_type_id, product_type_data) => {
  const transaction = await _DB.sequelize.transaction();
  try {
    const { product_type_name, product_category_list, product_brand_list } =
      product_type_data;
    const find_product_type = await _DB.product_type.findOne({
      where: {
        product_type_id,
      },
    });
    if (find_product_type) {
      const product_type_update = await find_product_type.update(
        { product_type_name },
        transaction
      );
      if (product_type_update) {
        const category = await update_category(
          find_product_type,
          product_category_list,
          { transaction }
        );
        const brand = await update_brand(
          find_product_type,
          product_brand_list,
          { transaction }
        );
        const [m1, m2] = await Promise.all([category, brand]);
        if (m1 && m2) {
          await transaction.commit();
          return {
            success: true,
            data: null,
          };
        } else {
          return {
            success: false,
            data: null,
            error: new Error("error while updating category and brand"),
            message: "error while updating category and brand",
          };
        }
      } else {
        return {
          success: false,
          data: null,
          error: new Error("error while updating product_type"),
          message: "error while updating product_type",
        };
      }
    } else {
      return {
        success: false,
        data: null,
        error: new Error(
          "product_type is not found with given product_type_id"
        ),
        message: "product_type is not found with given product_type_id",
      };
    }
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const update_category = async (
  find_product_type,
  product_category_list,
  { transcation }
) => {
  const find_type_category = await _DB.type_category.findAll({
    where: {
      product_type_id: find_product_type.product_type_id,
    },
  });
  if (find_type_category) {
    await _DB.type_category.destroy({
      where: {
        product_type_id: find_product_type.product_type_id,
      },
      transcation,
    });
    //if (type_category_delete) {
    const category_list = [];
    for (let a of product_category_list) {
      const find_category = await _DB.product_category.findOne({
        where: {
          category_name: a,
        },
      });

      if (!find_category) {
        category_list.push({
          category_name: a,
        });
      } else {
        await _DB.type_category.create(
          {
            category_id: find_category.category_id,
            product_type_id: find_product_type.product_type_id,
          },
          { transcation }
        );
      }
    }
    const create_category = await _DB.product_category.bulkCreate(
      category_list,
      {
        transcation,
      }
    );
    if (create_category) {
      const type_category_list = [];
      for (let b of create_category) {
        type_category_list.push({
          product_type_id: find_product_type.product_type_id,
          category_id: b.category_id,
        });
      }
      const create_type_category = await _DB.type_category.bulkCreate(
        type_category_list,
        { transcation }
      );
      if (create_type_category) {
        return {
          success: true,
          data: null,
        };
      } else {
        return {
          success: false,
          data: null,
          error: new Error("error while creating type_category"),
          message: "error while creating type_category",
        };
      }
    } else {
      return {
        success: false,
        data: null,
        error: new Error("error while updating category"),
        message: "error updating category",
      };
    }
    // } else {
    //  throw new Error("error while deletion");
    //}
  } else {
    return {
      success: false,
      data: null,
      error: new Error("error while finding with this product_type_id"),
      message: "error while finding with this product_type_id",
    };
  }
};

const update_brand = async (
  find_product_type,
  product_brand_list,
  { transcation }
) => {
  const find_type_brand = await _DB.type_brand.findAll({
    where: {
      product_type_id: find_product_type.product_type_id,
    },
  });
  if (find_type_brand.length) {
    await _DB.type_brand.destroy({
      where: {
        product_type_id: find_product_type.product_type_id,
      },
      transcation,
    });
    //if (type_brand_delete) {
    const brand_list = [];
    for (let a of product_brand_list) {
      const find_brand = await _DB.product_brand.findOne({
        where: {
          brand_name: a,
        },
      });

      if (!find_brand) {
        brand_list.push({
          brand_name: a,
        });
      } else {
        await _DB.type_brand.create(
          {
            brand_id: find_brand.brand_id,
            product_type_id: find_product_type.product_type_id,
          },
          { transcation }
        );
      }
    }
    const create_brand = await _DB.product_brand.bulkCreate(brand_list, {
      transcation,
    });
    if (create_brand) {
      const type_brand_list = [];
      for (let b of create_brand) {
        type_brand_list.push({
          product_type_id: find_product_type.product_type_id,
          brand_id: b.brand_id,
        });
      }
      const create_type_brand = await _DB.type_brand.bulkCreate(
        type_brand_list,
        { transcation }
      );
      if (create_type_brand) {
        return {
          success: true,
          data: null,
        };
      } else {
        return {
          success: false,
          data: null,
          error: new Error("error while creating type_brand"),
          message: "error while creating type_brand",
        };
      }
    } else {
      return {
        success: false,
        data: null,
        error: new Error("error while updating brand"),
        message: "error while updating brand",
      };
    }
    //} else {
    //throw new Error("error while deletion");
    //}
  } else {
    throw new Error("error while finding with this product_type_id");
  }
};
// const test = async () => {
//   const results = await _DB.sequelize.query("SELECT `product_type`.`product_type_name`, GROUP_CONCAT(DISTINCT `category_name`) AS `category_list`, GROUP_CONCAT(DISTINCT `brand_name`) AS `brand_list` FROM `product_type` AS `product_type` LEFT OUTER JOIN ( `type_category` AS `product_categories->type_category` INNER JOIN `product_category` AS `product_categories` ON `product_categories`.`category_id` = `product_categories->type_category`.`category_id`) ON `product_type`.`product_type_id` = `product_categories->type_category`.`product_type_id` LEFT OUTER JOIN ( `type_brand` AS `product_brands->type_brand` INNER JOIN `product_brand` AS `product_brands` ON `product_brands`.`brand_id` = `product_brands->type_brand`.`brand_id`) ON `product_type`.`product_type_id` = `product_brands->type_brand`.`product_type_id` GROUP BY `product_type`.`product_type_id`", {
//     type: _DB.Sequelize.QueryTypes['SELECT']
//   })
//   let a = '';
//   if (a == null) {
//     console.log('aaaa')
//   }
//   console.log(results)
// }

// test()

const create_product_data = async (specification_data) => {
  const transaction = await _DB.sequelize.transaction();
  try {
    const {
      product_name,
      model_name,
      product_description,
      quantity,
      price,
      product_type_name,
      brand_name,
    } = specification_data;
    const find_product_type = await _DB.product_type.findOne({
      where: {
        product_type_name,
      },
    });

    const find_product_brand = await _DB.product_brand.findOne({
      where: {
        brand_name,
      },
    });
    if (find_product_type && find_product_brand) {
      const add_product_details = await _DB.product.create(
        {
          product_name,
          model_name,
          product_description,
          quantity,
          price,
          product_type_id: find_product_type.product_type_id,
          brand_id: find_product_brand.brand_id,
        },
        { transaction }
      );
      if (add_product_details) {
        const findData = await _DB.product_type_attribute.findAll({
          where: {
            product_type_id: find_product_type.product_type_id,
          },
        });
        if (findData.length !== 0) {
          const specification_list = [];
          for (let i of findData) {
            specification_list.push({
              product_id: add_product_details.product_id,
              attribute_id: i.attribute_id,
              value: specification_data[i.attribute_name],
            });
          }

          const add_product_specification =
            await _DB.product_attribute_value.bulkCreate(specification_list, {
              transaction,
            });
          if (add_product_specification.length !== 0) {
            await transaction.commit();
            return true;
          } else {
            throw new Error("error while creating specifications");
          }
        } else {
          throw new Error("no data available");
        }
      } else {
        throw new Error("error while adding product details");
      }
    } else {
      throw new Error(
        "product_type or product_category pr product_brand is is not found with given data"
      );
    }
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};
//improve
const product_listing = async (
  { product_type_id, brand_id, product_name, low_price, high_price, ram_value },
  { sortby = {}, pagination = {} }
) => {
  let filter = {
    where: {},
  };
  if (product_type_id) {
    filter.where.product_type_id = product_type_id;
  }
  if (brand_id) {
    filter.where.brand_id = brand_id;
  }

  if (product_name) {
    filter.where.product_name = product_name;
  }

  if (low_price) {
    filter.where.price = { [Op.gte]: low_price };
  }
  if (high_price) {
    filter.where.price = { [Op.lte]: high_price };
  }
  if (low_price && high_price) {
    filter.where.price = { [Op.between]: [low_price, high_price] };
  }

  filter.attributes = [
    "product_name",
    "model_name",
    "product_description",
    "quantity",
    "price",

    [
      sequelize.literal(
        `(SELECT JSON_ARRAYAGG(JSON_OBJECT('attribute_name',
                              product_type_attribute.attribute_name,
                              'attribute_value',
                              product_attribute_value.value))
      FROM
          product_attribute_value
              LEFT JOIN
          product_type_attribute ON product_attribute_value.attribute_id = product_type_attribute.attribute_id
          where
          product_attribute_value.product_id=product.product_id)
          `
      ),
      "attribute_list",
    ],
  ];

  filter.order = helper.getSortFilter(sortby);

  if ("page" in pagination && "limit" in pagination) {
    page = Number(pagination.page);
    filter.offset = Number((pagination.page - 1) * pagination.limit);
    filter.limit = Number(pagination.limit);
  }
  filter.include = {
    model: _DB.product_attribute_value,
    attributes: [],
    include: {
      model: _DB.product_type_attribute,
      attributes: [],
    },
  };

  if (ram_value) {
    const result = await _DB.sequelize.query(
      `SELECT 
    p.product_name,
    p.product_id,
    (SELECT 
            JSON_ARRAYAGG(JSON_OBJECT('attribute_name',
                                product_type_attribute.attribute_name,
                                'attribute_value',
                                product_attribute_value.value))
        FROM
            product_attribute_value
                JOIN
            product_type_attribute ON product_type_attribute.attribute_id = product_attribute_value.attribute_id
              where
             product_attribute_value.product_id=p.product_id
            ) AS attribute_list
FROM
    product AS p
        JOIN
    product_attribute_value AS pav ON pav.product_id = p.product_id
        JOIN
    product_type_attribute AS pta ON pta.attribute_id = pav.attribute_id
    and pta.attribute_name='ram'
    and pav.value='${ram_value}'
GROUP BY p.product_id
`,
      {
        type: _DB.Sequelize.QueryTypes["SELECT"],
      }
    );
    return result;
  } else {
    const all_products = await _DB.product.findAll({
      where: filter.where,
      offset: filter.offset,
      limit: filter.limit,
      order: filter.order,
      attributes: filter.attributes,
      include: filter.include,
      group: "product.product_id",
    });
    if (all_products.length >= 0) {
      return all_products;
    } else {
      throw new Error("error while getting all products");
    }
  }
};

const specific_product_listing = async (product_id) => {
  const specific_product = await _DB.product.findOne({
    where: {
      product_id,
    },
    include: {
      model: _DB.product_attribute_value,
      attributes: ["value"],
      include: {
        model: _DB.product_type_attribute,
        attributes: ["attribute_name"],
      },
    },
    raw: true,
  });
  if (specific_product.length >= 0) {
    return specific_product;
  } else {
    throw new Error(`don't find product with this product_id`);
  }
};

const delete_product = async (product_id) => {
  const find_product = await _DB.product.findOne({
    where: {
      product_id,
    },
  });
  if (find_product) {
    const product_delete = await find_product.destroy();
    if (product_delete) {
      return true;
    } else {
      throw new Error("error while deleting");
    }
  } else {
    throw new Error("product is not found whit this product_id");
  }
};

const update_product = async (product_id, product_data) => {
  const find_product = await _DB.product.findOne({
    where: {
      product_id,
    },
  });
  if (find_product) {
    await find_product.update(product_data, {
      fields: [
        "product_name",
        "model_name",
        "product_description",
        "price",
        "quantity",
      ],
    });
    return true;
  } else {
    throw new Error("attribute is not found with this product_id");
  }
};

module.exports = {
  create_product_type,
  delete_product_type,
  product_type_listing,
  specific_product_type,
  update_product_type,
  create_product_data,
  product_listing,
  specific_product_listing,
  delete_product,
  update_product,
};
