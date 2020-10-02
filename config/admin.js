const mysql = require("mysql");
const express = require("express");
const router = express.Router();
const fs = require("fs-extra");
var path = require("path");
var multer = require("multer");
var crypto = require("crypto");
const bcrypt = require("bcrypt-nodejs");
const passport = require("passport");
require("../config/passport")(passport);
var LocalStrategy = require("passport-local").Strategy;

var session = require('express-session');
var flash = require('connect-flash');
router.use(
  session({
    cookie: { maxAge: 60000 },
    secret: "secret",
    resave: false,
    saveUninitialized: false
  })
);
router.use(flash());

router.use(function(req, res, next){
    res.locals.message = req.flash();
    next();
});

var cors = require("cors");
var method = require("method-override");
router.use(cors());

const helmet = require("helmet");
router.use(helmet());

require("cookie-parser");

// DB CONFIGURATION hope this works outs :-)
var myconnection = mysql.createConnection({
  host: "localhost",
  user: "sweettoo_nspace",
  password: "y8]C-=5YW~fs",
  database: "sweettoo_nspace",
  multipleStatements: true
});
myconnection.connect(err => {
  if (!err) {
    console.log("Database connected");
  } else {
    console.log("unable to connect");
  }
});

//authentication
const { ensureAuthenticated } = require("../config/auth");


// SET STORAGE
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/portfolio')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + file.originalname)
  }
});
 
var upload = multer({ storage: storage });

router.get("/admin/index",ensureAuthenticated, (req, res) => { 
  let sql1 = "SELECT * FROM portfolio";
  let sql2 = "SELECT * FROM reviews";
  let query = myconnection.query(sql1, (err, rows) => {
    if (err) throw err;
    let query = myconnection.query(sql2, (err, reviews) => {
      if (err) throw err;
        res.render("./admin/index", { allDocs: rows, allReviews: reviews });
    });
  });
});

router.post('/uploadportfolio', upload.single('myPortfolio'), function (req, res){ 
  var newData = {
    title: req.body.title,
    filename: req.file.filename,
    category: req.body.category,
    site: req.body.site
  };

  let sql = "INSERT INTO portfolio SET ?";
    let query = myconnection.query(sql, newData, (err, results) => {
      if (err) throw err;
      res.redirect("/admin/index");
    });
});

router.post('/uploadreview', function (req, res){
    var newReview = req.body;
    
    console.log(newReview);
    let sql = "INSERT INTO reviews SET ?";
    let query = myconnection.query(sql, newReview, (err, results) => {
        if (err) throw err;
        res.redirect("/admin/index");
    });
});

router.get("/:id/deletePortfolio",ensureAuthenticated, (req, res) => {
  var portfolioId = req.params.id;
  myconnection.query("SELECT * FROM portfolio WHERE id = ?",[portfolioId],(err, rows, fields) => {
      if (!err) {
        var files = rows[0].filename;
        fs.unlink(path.join("public/uploads/portfolio/", files), err => {
          if (err) throw err;
          console.log("image deleted succesfuly");
          let sql = "DELETE FROM portfolio WHERE id = ?";
          myconnection.query(sql,[portfolioId], (err, result) => {
            if (err) throw err;
            res.redirect("/admin/index");
          });
        });
      }
    }
  );
});

router.get("/:id/deleteReview",ensureAuthenticated, (req, res) => {
    var reviewId = req.params.id;
    let sql = 'DELETE FROM reviews WHERE id = ?';
    myconnection.query(sql,[reviewId], (err, result) => {
        if (err) throw err;
        res.redirect("/admin/index");
    });
});

router.get("/admin/pages",ensureAuthenticated, (req, res) => { res.render("./admin/pages"); });

// blog
 // SET STORAGE
 var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/blogs')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + 'Nspace-' + Date.now() + file.originalname)
  }
});
 
var upload = multer({ storage: storage });

router.get("/admin/blog",ensureAuthenticated, (req, res) => {
    let sql = "SELECT * FROM blog";
    let query = myconnection.query(sql, (err, blog) => {
        if (err) throw err;
        res.render("./admin/blog", { allBlogs: blog });
    }); 
});

router.post("/uploadblog", upload.single('myBlog'), (req, res) => {
    var myData = {
        blogTitle: req.body.blogTitle,
        category: req.body.category,
        content: req.body.content,
        filename: req.file.filename,
        author: "Sam"
  };

  let sql = "INSERT INTO blog SET ?";
    let query = myconnection.query(sql, myData, (err, results) => {
      if (err) throw err;
      res.redirect("/admin/blog");
    });
});

router.get("/admin/blog/(:id)/edit", ensureAuthenticated, (req, res) => {
  const blogId = req.params.id;
  
  let sql = "SELECT * FROM blog WHERE id = ?";
  let sql1 = "SELECT * FROM comment WHERE blogId = ?";
  myconnection.query(sql,[blogId], (err, result, fields) => {
    if(err) throw err;
    myconnection.query(sql1,[blogId], (err, comment, fields) => {
        if(err) throw err;
        res.render("./admin/edit", { blogs: result[0], allComments: comment });
    });
  });
});

router.post("/admin/blog/:id/edit", (req, res) => {
  const blogId = req.params.id;
  
    let blogTitle = req.body.blogTitle;
    let category = req.body.category;
    let content = req.body.content;
    let sql = "UPDATE `blog` SET `blogTitle` = '" + blogTitle + "', `category` = '" + category + "', `content` = '" + content + "' WHERE `blog`.`id` = '" + blogId + "'";
    myconnection.query(sql, (err, results) => {
	  if (err) {
                return res.status(500).send(err);
            }
	  res.redirect("/admin/blog");
	});
});

router.get("/admin/blog/comments/:id/delete",ensureAuthenticated, (req, res) => {
    var commentId = req.params.id;
    let sql = 'DELETE FROM comment WHERE id = ?';
    myconnection.query(sql,[commentId], (err, result) => {
        if (err) throw err;
        res.redirect("/admin/blog");
    });
});

router.get("/admin/blog/(:id)/delete",ensureAuthenticated, (req, res) => {
    var blogId = req.params.id;
    myconnection.query("SELECT * FROM blog WHERE id = ?",[blogId],(err, rows, fields) => {
      if (!err) {
        var files = rows[0].filename;
        fs.unlink(path.join("public/uploads/blogs", files), err => {
          if (err) throw err;
          let sql = "DELETE FROM blog WHERE id = ?";
          myconnection.query(sql,[blogId], (err, result) => {
            if (err) throw err;
            res.redirect("/admin/blog");
          });
        });
      }
    }
  );
});

router.get("/admin/contact",ensureAuthenticated, (req, res) => { 
  let sql = "SELECT * FROM contact";
  let query = myconnection.query(sql, (err, rows) => {
    if (err) throw err;
    console.log(rows);
    res.render("./admin/contact", { allContacts: rows });
  });
});

router.get("/admin/contact/:id/delete",ensureAuthenticated, (req, res) => {
  var contactId = req.params.id;
  let sql = 'DELETE FROM contact WHERE id = ?';
  myconnection.query(sql,[contactId], (err, result) => {
    if (err) throw err;
    res.redirect("/admin/contact");
  });
});
router.get("/admin/edit",ensureAuthenticated, (req, res) =>{ res.render("./admin/edit"); });

router.get("/signup", (req, res) => {
  res.render("./admin/signup");
});
router.post(
  "/signup",
  passport.authenticate("local-signup", {
    successRedirect: "/admin",
    failureRedirect: "/",
    failureFlash: true
  })
);

//Log in Handle
router.get("/admin", (req, res) =>{ res.render("./admin/admin"); });

router.post(
  "/login",
  passport.authenticate("local-login", {
    successRedirect: "/admin/index",
    failureRedirect: "/admin",
    failureFlash: true,
    successFlash: "welcome back!"
  }),
  function(req, res) {
    if (req.body.remember) {
      req.session.cookie.maxAge = 1000 * 60 * 3;
    } else {
      req.session.cookie.expires = false;
    }
    res.redirect("/admin/index");
  }
);

//logout Handle
router.get("/logout",ensureAuthenticated, (req, res) => {
  req.logout();
  req.flash("success", "you've been successfully logged out!");
  res.redirect("/admin");
});

module.exports = router;