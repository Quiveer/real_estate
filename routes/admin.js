const mysql = require('mysql');
const express = require('express');
const router = express.Router();
const fs = require('fs');
var path = require("path");
var multer = require("multer");
const passport = require("passport");
require("../config/passport")(passport);

var session = require('express-session');
var flash = require('connect-flash');
router.use(
  session({
    cookie: { maxAge: 100 },
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
router.use(cors());

const helmet = require("helmet");
router.use(helmet());

require("cookie-parser");

// DB CONFIGURATION hope this works outs :-)
var myconnection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Likeable",
  database: "real_estate",
  insecureAuth : true,
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

router.get("/admin/home", ensureAuthenticated, (req, res) => {
  let sql = "SELECT * FROM reviews";
    let query = myconnection.query(sql, (err, review) => {
      if (err) throw err;
      res.render("./admin/home", { allReviews: review });
  });
});
router.post("/addreview", ensureAuthenticated, (req, res) =>  {
  var myData = req.body;
    
  console.log(myData);
  let sql = "INSERT INTO reviews SET ?";
  let query = myconnection.query(sql, myData, (err, results) => {
      if (err) throw err;
      req.flash("success", "Message sent successfully!");
      res.redirect("./admin/home");
  });
});
router.get("/admin/review/:id/delete", ensureAuthenticated, (req, res) => {
  var reviewId = req.params.id;
  let sql = 'DELETE FROM reviews WHERE id = ?';
  myconnection.query(sql,[reviewId], (err, result) => {
      if (err) throw err;
      res.redirect("/admin/home");
  });
});

// Property

 // SET STORAGE
 var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + file.originalname)
    }
  });
   
  var upload = multer({ storage: storage });
  
router.get("/admin/add-house", ensureAuthenticated, (req, res) => { res.render("./admin/add-house"); });
router.post("/uploadhouse", ensureAuthenticated, upload.single('myHouses'), (req, res) => {
  var newData = {
    filename: req.file.filename,
    title: req.body.title,
    location: req.body.location,
    size: req.body.size,
    price: req.body.price,
    bedroom: req.body.bedroom,
    bathroom: req.body.bathroom,
    category: req.body.category,
    description: req.body.description
  };

  let sql = "INSERT INTO property SET ?";
    let query = myconnection.query(sql, newData, (err, results) => {
      if (err) throw err;
      res.redirect("/admin/add-house");
    });
});
router.get("/admin/manage-houses", ensureAuthenticated, (req, res) => {
let sql = "SELECT * FROM property WHERE category = 'house'";
  let query = myconnection.query(sql, (err, house) => {
    if (err) throw err;
    res.render("./admin/manage-houses", { allHouses: house});
  });
});
router.get("/admin/house/:id/edit", ensureAuthenticated, (req, res) => {
  const houseId = req.params.id;
  
  let sql = "SELECT * FROM property WHERE id = ?";
  myconnection.query(sql,[houseId], (err, result, fields) => {
    if(err) throw err;
        res.render("./admin/edit-house", { house: result[0] });
  });
});
router.post("/admin/house/:id/edit", ensureAuthenticated, (req, res) => {
  const houseId = req.params.id;
  
  let title = req.body.title;
  let location = req.body.location;
  let size = req.body.size;
  let price = req.body.price;
  let bedroom = req.body.bedroom;
  let bathroom = req.body.bathroom;
  let description = req.body.description;
  let sql = "UPDATE `property` SET `title` = '" + title + "', `location` = '" + location + "', `size` = '" + size + "', `bedroom` = '" + bedroom + "', `bathroom` = '" + bathroom + "', `price` = '" + price + "', `description` = '" + description + "' WHERE `property`.`id` = '" + houseId + "'";
  myconnection.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.redirect("/admin/manage-houses");
});
});
router.get("/admin/house/:id/delete", ensureAuthenticated, (req, res) => {
  var houseId = req.params.id;
    myconnection.query("SELECT * FROM property WHERE id = ?",[houseId],(err, rows, fields) => {
      if (!err) {
        var files = rows[0].filename;
        fs.unlink(path.join("public/uploads", files), err => {
          if (err) throw err;
          let sql = "DELETE FROM property WHERE id = ?";
          myconnection.query(sql,[houseId], (err, result) => {
            if (err) throw err;
            res.redirect("/admin/manage-houses");
          });
        });
      }
    }
  );
});

// Land

 // SET STORAGE
 var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + file.originalname)
  }
});
 
var upload = multer({ storage: storage });

router.get("/admin/add-land", ensureAuthenticated, (req, res) => { res.render("./admin/add-land"); });
router.post("/uploadland", ensureAuthenticated, upload.single('myLands'), (req, res) => {
  var newData = {
    filename: req.file.filename,
    title: req.body.title,
    location: req.body.location,
    size: req.body.size,
    price: req.body.price,
    category: req.body.category,
    description: req.body.description
  };

  let sql = "INSERT INTO property SET ?";
    let query = myconnection.query(sql, newData, (err, results) => {
      if (err) throw err;
      res.redirect("/admin/add-land");
    });
});
router.get("/admin/manage-lands", ensureAuthenticated, (req, res) => { 
  let sql = "SELECT * FROM property WHERE category = 'land'";
  let query = myconnection.query(sql, (err, land) => {
    if (err) throw err;
    res.render("./admin/manage-lands", { allLands: land});
  });
});
router.get("/admin/land/:id/edit", ensureAuthenticated, (req, res) => {
  const landId = req.params.id;
  
  let sql = "SELECT * FROM property WHERE id = ?";
  myconnection.query(sql,[landId], (err, result, fields) => {
    if(err) throw err;
        res.render("./admin/edit-land", { land: result[0] });
  });
});
router.post("/admin/land/:id/edit", ensureAuthenticated, (req, res) => {
  const landId = req.params.id;
  
  let title = req.body.title;
  let location = req.body.location;
  let size = req.body.size;
  let price = req.body.price;
  let description = req.body.description;
  let sql = "UPDATE `property` SET `title` = '" + title + "', `location` = '" + location + "', `size` = '" + size + "', `price` = '" + price + "', `description` = '" + description + "' WHERE `property`.`id` = '" + landId + "'";
  myconnection.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.redirect("/admin/manage-lands");
});
});
router.get("/admin/land/:id/delete", ensureAuthenticated, (req, res) => {
  var landId = req.params.id;
    myconnection.query("SELECT * FROM property WHERE id = ?",[landId],(err, rows, fields) => {
      if (!err) {
        var files = rows[0].filename;
        fs.unlink(path.join("public/uploads", files), err => {
          if (err) throw err;
          let sql = "DELETE FROM property WHERE id = ?";
          myconnection.query(sql,[landId], (err, result) => {
            if (err) throw err;
            res.redirect("/admin/manage-lands");
          });
        });
      }
    }
  );
});

// Property

 // SET STORAGE
 var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + file.originalname)
  }
});
 
var upload = multer({ storage: storage });

router.get("/admin/add-motor", ensureAuthenticated, (req, res) => { res.render("./admin/add-motor"); });
router.post("/uploadmotor", upload.single('myMotors'), (req, res) => {
  var newData = {
    filename: req.file.filename,
    title: req.body.title,
    price: req.body.price,
    category: req.body.category,
    description: req.body.description
  };

  let sql = "INSERT INTO property SET ?";
    let query = myconnection.query(sql, newData, (err, results) => {
      if (err) throw err;
      res.redirect("/admin/add-motor");
    });
});
router.get("/admin/manage-motors", ensureAuthenticated, (req, res) => { 
  let sql = "SELECT * FROM property WHERE category = 'motor'";
  let query = myconnection.query(sql, (err, motor) => {
    if (err) throw err;
    res.render("./admin/manage-motors", { allMotors: motor});
  });
});
router.get("/admin/motor/:id/edit", ensureAuthenticated, (req, res) => {
  const motorId = req.params.id;
  
  let sql = "SELECT * FROM property WHERE id = ?";
  myconnection.query(sql,[motorId], (err, result, fields) => {
    if(err) throw err;
        res.render("./admin/edit-motor", { motor: result[0] });
  });
});
router.post("/admin/motor/:id/edit", ensureAuthenticated, (req, res) => {
  const motorId = req.params.id;
  
  let title = req.body.title;
  let price = req.body.price;
  let description = req.body.description;
  let sql = "UPDATE `property` SET `title` = '" + title + "', `price` = '" + price + "', `description` = '" + description + "' WHERE `property`.`id` = '" + motorId + "'";
  myconnection.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.redirect("/admin/manage-motors");
  });
});
router.get("/admin/motor/:id/delete", ensureAuthenticated, (req, res) => {
  var motorId = req.params.id;
    myconnection.query("SELECT * FROM property WHERE id = ?",[motorId],(err, rows, fields) => {
      if (!err) {
        var files = rows[0].filename;
        fs.unlink(path.join("public/uploads", files), err => {
          if (err) throw err;
          let sql = "DELETE FROM property WHERE id = ?";
          myconnection.query(sql,[motorId], (err, result) => {
            if (err) throw err;
            res.redirect("/admin/manage-motors");
          });
        });
      }
    }
  );
});

// -----------------------

router.get("/admin/manage-orders", ensureAuthenticated, (req, res) => {

  let sql = "SELECT * FROM orders WHERE status IS NULL";
  let query = myconnection.query(sql, (err, order, rows) => {
    if (err) throw err;
    res.render("./admin/manage-orders", {allOrders: order });
  });
});

router.get("/admin/property/:id/sold", ensureAuthenticated, (req, res) => {
  const propertyId = req.params.id;
  const status = "sold";
  const orderStatus = "sold";
  
  let sql = "UPDATE `property` SET `status` = '" + status + "' WHERE `property`.`id` = '" + propertyId + "'";
  let sql2 = "UPDATE `orders` SET `status` = '" + orderStatus + "' WHERE `orders`.`propertyId` = '" + propertyId + "'";
  myconnection.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    myconnection.query(sql2, (err, results) => {
      if (err) return res.status(500).send(err);
      res.redirect("/admin/manage-orders");
    });
  });
});

router.get("/admin/:id/view-property", ensureAuthenticated, (req, res) => {
  const propertyId = req.params.id;
  
  let sql = "SELECT * FROM property WHERE id = ?";
  myconnection.query(sql,[propertyId], (err, result, fields) => {
    if(err) throw err;
        res.render("./admin/view-property", { property: result[0] });
  });
});

router.get("/admin/order/:id/delete", ensureAuthenticated, (req, res) => {
  var orderId = req.params.id;
  let sql = 'DELETE FROM orders WHERE id = ?';
  myconnection.query(sql,[orderId], (err, result) => {
      if (err) throw err;
      res.redirect("/admin/manage-orders");
  });
});

router.get("/admin/contact", ensureAuthenticated, (req, res) => { 
  let sql = "SELECT * FROM contact";
    let query = myconnection.query(sql, (err, message) => {
      if (err) throw err;
      res.render("./admin/contact", { allMessages: message });
    });
});
router.get("/admin/contact/:id/delete", ensureAuthenticated, (req, res) => {
    var contactId = req.params.id;
    let sql = 'DELETE FROM contact WHERE id = ?';
    myconnection.query(sql,[contactId], (err, result) => {
        if (err) throw err;
        res.redirect("/admin/contact");
    });
});

router.get("/admin/view-sales", ensureAuthenticated, (req, res) => {

  let sql = "SELECT * FROM orders WHERE status = 'sold' ORDER BY id DESC";
  let query = myconnection.query(sql, (err, sale, rows) => {
    if (err) throw err;
    res.render("./admin/view-sales", {allSales: sale });
  });
});
router.get("/admin/sale/:id/delete", ensureAuthenticated, (req, res) => {
  var orderId = req.params.id;
  let sql = 'DELETE FROM orders WHERE id = ?';
  myconnection.query(sql,[orderId], (err, result) => {
      if (err) throw err;
      res.redirect("/admin/view-sales");
  });
});

// Sign Up Handle
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
    successRedirect: "/admin/home",
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
    res.redirect("/admin/home");
  }
);

//logout Handle
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "you've been successfully logged out!");
  res.redirect("/admin");
});


module.exports = router;