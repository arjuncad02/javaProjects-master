/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: __Arjun_Sagar_Dhunna__ Student ID: __157099219__ Date: __2023-03-24__
*
*    Online (Cyclic) Link: https://dull-plum-xerus-toga.cyclic.app
*
********************************************************************************/ 
var express = require("express");
var path = require("path");
var app = express();
//var blog = require(__dirname + "/blog-service.js");
const stripJs = require('strip-js');
const blog = require("./blog-service");
const multer = require("multer");
const cloudinary = require('cloudinary').v2
const streamifier = require('streamifier')
const upload = multer();// no { storage: storage } since we are not using disk storage
const exphbs = require('express-handlebars');

const authData = require('./auth-service');
const clientSessions = require('client-sessions')

var HTTP_PORT = process.env.PORT || 8080;

function onHttpStart() 
{
    console.log("Express http server listening on: " + HTTP_PORT);
}
app.use(express.static('public'));



app.engine('.hbs', exphbs.engine({ 
    extname: '.hbs',
    helpers: { 
        navLink: function(url, options){
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') + 
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        },
        safeHTML: function(context){
            return stripJs(context);
        }        
    }
}));


app.use(clientSessions({
    cookieName: "session",
    secret: "secret",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60
}));


function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    }
    else {
        next();
    }
}

app.use(express.urlencoded({extended: true}));
app.set('view engine', '.hbs');

app.use(function(req,res,next){
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});


app.get("/", function(req,res){
    res.redirect('/about');
  });

app.get("/about", function(req,res){
    res.render('about');
  });

  app.get('/blog', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blogData.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // get the latest post from the front of the list (element 0)
        let post = posts[0]; 

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;
        viewData.post = post;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blogData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})

});

app.get('/blog/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};

    try{

        // declare empty array to hold "post" objects
        let posts = [];

        // if there's a "category" query, filter the returned posts by category
        if(req.query.category){
            // Obtain the published "posts" by category
            posts = await blogData.getPublishedPostsByCategory(req.query.category);
        }else{
            // Obtain the published "posts"
            posts = await blogData.getPublishedPosts();
        }

        // sort the published posts by postDate
        posts.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

        // store the "posts" and "post" data in the viewData object (to be passed to the view)
        viewData.posts = posts;

    }catch(err){
        viewData.message = "no results";
    }

    try{
        // Obtain the post by "id"
        viewData.post = await blogData.getPostById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }

    try{
        // Obtain the full list of "categories"
        let categories = await blogData.getCategories();

        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }

    // render the "blog" view with all of the data (viewData)
    res.render("blog", {data: viewData})
});

app.get('/categories/delete/:id', ensureLogin, (req, res) => {
    blog.deleteCategoryById(req.params.id).then(() => {
        res.redirect('/categories');
      })
      .catch(() => {
        console.log("Unable to remove category / Category not found");
      });
  });

app.get("/posts", ensureLogin, (req, res)=>
  {
    if(req.query.minDate) {
        blog.getPostsByMinDate(req.query.minDate).then((data) => 
        {
            res.render("posts",{posts: data});
        })
        .catch((err) => 
        {
            res.render("posts",{message: "no result"});
        })
    }

    else if(req.query.category) {
        blog.getPostsByCategory(req.query.category).then((data) => 
        {
            res.render("posts",{posts: data});
        })
        .catch((err) => 
        {   
            res.render("posts",{message: "no result"});
        })
    }

else {
    blog.getAllPosts().then((data) =>
  {
    res.render("posts",{posts: data});
  }).catch((err) => 
  {
    res.render("posts",{message: "no result"});
  })
}
  });

  app.get("/post/:value", ensureLogin, (req, res) => 
  {
    blog.getPostById(req.params.value).then((data) => 
    {
        res.json({data});
    })
    .catch((err) => 
    {
        res.json({message: err});
    })
  });

  cloudinary.config({
    cloud_name: 'dg87xtoi5',
    api_key: '464978948788995',
    api_secret: 'HHzDJaJZlzchX7DIbfk13Khnn2g',
    secure: true
});


  app.get("/posts/add", ensureLogin, function(req,res){
    res.render('addPost');
  });

  app.get("/categories", ensureLogin, (req, res)=>
  {
      blog.getCategories().then((data)=>
      {
          res.render("categories",{categories: data});
      }).catch((err) => 
      {
          res.render("categories",{message: "no result"});
      })
  });

  app.get('/categories/add', ensureLogin, (req, res) => {
    res.render('addCategory');
});

  app.post("/categories/add", ensureLogin, (req, res) => {
    let Object = {};
    Object.category = req.body.category;
    console.log(req.body.category);
    if (req.body.category != "") {
      addCategory(Object)
        .then(() => {
          res.redirect("/categories");
        })
        .catch(() => {
          console.log("Some error occured");
        });
    }
  });

  app.get("/posts/delete/:id", ensureLogin, (req, res) => {
    deletePostById(req.params.id)
      .then(() => {
        res.redirect("/posts");
      })
      .catch(() => {
        console.log("Unable to remove category / Category not found");
      });
  });

  app.post("/posts/add", ensureLogin, upload.single("featureImage"), (req, res) => 
  {
    let streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            let stream = cloudinary.uploader.upload_stream(
                (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
                }
            );
    
            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
    };
    
    async function upload(req) {
        let result = await streamUpload(req);
        console.log(result);
        return result;
    }
    
    upload(req).then((uploaded)=>{
        req.body.featureImage = uploaded.url;
        let addBlog = {};

            addBlog.body = req.body.body;
            addBlog.title = req.body.title;
            addBlog.postDate = Date.now();
            addBlog.category = req.body.category;
            addBlog.featureImage = req.body.featureImage;
            addBlog.published = req.body.published;

            blog.addPost(addBlog);
            res.redirect('/posts'); 
    });
    
  });
  


//app.listen(HTTP_PORT, onHttpStart());

blog.initialize().then(() => 
{
 app.listen(HTTP_PORT, onHttpStart());
}).catch (() => 
{
    console.log('Promise is not Resolved');
});




app.get("/login", (req, res) => {
    res.render('login');
});

app.get("/register", (req, res) => {
    res.render('register');
});

app.post("/register", (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render('register', { successMessage: "User Created" });
        })
        .catch((err) => {
            res.render('register', {
                errorMessage: err,
                userName: req.body.userName
            });
        })
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');

    authData.checkUser(req.body).then((user) => {
        req.session.user = {
            "userName": user.userName,
            "email": user.email,
            "loginHistory": user.loginHistory
        }
        res.redirect('/posts');
    })
        .catch((err) => {
            res.render('login', {
                errorMessage: err,
                userName: req.body.userName
            });
        })
});

app.get('/logout', (req, res) => {
    req.session.reset();
    res.redirect('/login');
});

app.get('/userHistory', (req, res) => {
    res.render('userHistory');
})
// 404 page
app.use((req, res) => {
    res.status(404).render('404')
});

app.use((req, res)=>
{
    res.status(404).end('404 Page Not Found');
});