const Sequelize = require("sequelize");
const { gte } = Sequelize.Op;

// set up sequelize to point to our postgres database
var sequelize = new Sequelize(
  "kedggegv",
  "kedggegv",
  "NUxPMyBD8nXkZuRHLhYvC_Fzeik2c_Ou",
  {
    host: "raja.db.elephantsql.com",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  }
);

const Post = sequelize.define("Post", {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
  });
  
  // Defining the Category Model
  const Category = sequelize.define("Category", {
    category: Sequelize.STRING,
  });

  Post.belongsTo(Category, { foreignKey: "category" });

  module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        sequelize.sync().then(function () {
            resolve();
        }).catch(function (error) {
            console.log(error);
            reject("Unable to sync the Database");
        })
    });
}

module.exports.getPostsByCategory = function (category) {
  return new Promise((resolve, reject) => {
      Post.findAll({
          where: {
              category: category
          }
      }).then(function (data) {
          resolve(data)
      }).catch(function (error) {
          reject("No record Found");
      });
  });
}

module.exports.getPostsByMinDate = function (minDateStr) {
  return new Promise((resolve, reject) => {
      const { gte } = Sequelize.Op;

      Post.findAll({
          where: {
              postDate: {
                  [gte]: new Date(minDateStr)
              }
          }
      }).then(function (data) {
          resolve(data);
      }).catch(function (error) {
          reject("No record Found");
      })

  });
}

module.exports.getAllPosts = function () {
  return new Promise((resolve, reject) => {
      Post.findAll().then(function (data) {
          resolve(data);
      }).catch(function (error) {
          reject("No record Found");
      })
  });
}

module.exports.getPostById = function (id) {
  return new Promise((resolve, reject) => {
      Post.findAll({
          where: {
              id: id
          }
      }).then(function (data) {
          resolve(data)
      }).catch(function (error) {
          reject("No record Found");
      });
  });
}


module.exports.addPost = function (postData) {
  return new Promise((resolve, reject) => {
      postData.published = (postData.published) ? true : false;
      for (let field in postData) {
          if (postData[field] == '') {  
              postData[field] = null;
          }
      }
      postData.postDate = new Date();
      Post.create(postData).then(function (data) {
          resolve(data)
      }).catch(function (error) {
          reject("No record Found");
      })
  });
};

module.exports.getCategories = function () {
  return new Promise((resolve, reject) => {
      Category.findAll().then(function (data) {
          resolve(data)
      }).catch(function (error) {
          reject("No record Found");
      });
  });
}

module.exports.getPublishedPosts = function () {
  return new Promise((resolve, reject) => {
      Post.findAll({
          where: {
              published: true
          }
      }).then(function (data) {
          resolve(data)
      }).catch(function (error) {
          reject("No record Found");
      });
  });
};

module.exports.getPublishedPostsByCategory = function (category) {
  return new Promise((resolve, reject) => {
      Post.findAll({
          where: {
              category: category,
              published: true
          }
      }).then(function (data) {
          resolve(data)
      }).catch(function (error) {
          reject("No record Found");
      });
  });
}

module.exports.addCategory = function (categoryData) {
  return new Promise((resolve, reject) => {
      for (let field in categoryData) {
          if (categoryData[field] == '') {  
              categoryData[field] = null;
          }
      }
      Category.create(categoryData).then(function (data) {
          resolve(data)
      }).catch(function (error) {
          reject("No record Found")
      })
  });
};

module.exports.deleteCategoryById = function (id) {
  return new Promise((resolve, reject) => {
      Category.destroy({
          where: {
              id: id
          }
      }).then(function (data) {
          resolve("Category");
      }).catch(function (error) {
          reject("unable to Delete Category");
      })
  });
};

module.exports.deletePostById = function (id) {
  return new Promise((resolve, reject) => {
      Post.destroy({
          where: {
              id: id
          }
      }).then(function (data) {
          resolve();
      }).catch(function (error) {
          reject("Unable to Delete Post");
      })
  });
};