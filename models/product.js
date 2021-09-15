module.exports = (sequelize, Sequelize) => {
  const product = sequelize.define("product", {
    product_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      notNull: true,
    },
    product_name: {
      type: Sequelize.STRING(60),
      allowNull: false,
    },
    model_name: {
      type: Sequelize.STRING(60),
      allowNull: false,
    },
    product_description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    price: {
      type: Sequelize.INTEGER,
      allowNull: false,
      min: 5000,
      max: 200000,
    },
    product_type_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });
  product.associate = (models) => {
    product.hasMany(models.product_attribute_value, {
      foreignKey: "product_id",
    });
    product.belongsTo(models.product_type, { foreignKey: "product_type_id" });
  };
  return product;
};