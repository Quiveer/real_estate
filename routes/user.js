const mysql = require('mysql');
const express = require('express');
const router = express.Router();

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


router.get("/", (req, res) => {
  let sql1 = "SELECT * FROM property ORDER BY id DESC;";
  let sql2 = "SELECT * FROM reviews";
  let query = myconnection.query(sql1, (err, item) => {
    if (err) throw err;
    let query = myconnection.query(sql2, (err, review) => {
      if (err) throw err;
      res.render("./user/index", {allItems: item, allReviews: review});
    });
  });
});

router.get("/properties", (req, res) => {
  let sql = "SELECT * FROM property ORDER BY id DESC";
  let query = myconnection.query(sql, (err, item) => {
    if (err) throw err;
    res.render("./user/properties", {allItems: item});
  }); 
});

router.get("/(:id)/property", (req, res) => { 
  var propertyId = req.params.id;
  let sql = "SELECT * FROM property WHERE id = ?";
  
  myconnection.query(sql,[propertyId], (err, result, fields) => {
    if(err) throw err;
    res.render("./user/property", { property: result[0] });
  });
});

router.post("/(:id)/order", (req, res) =>  {
  let orderId = req.params.id;
  let username = req.body.username;
  let email = req.body.email;
  let phone = req.body.phone;
  let title = req.body.title;
  let price = req.body.price;
    
  let sql = "INSERT INTO orders (username, email, phone, title, price, propertyId) VALUES( ?, ?, ?, ?, ?, (SELECT id FROM property WHERE id = ?))";
  let query = myconnection.query(sql, [username, email, phone, title, price, orderId], (err, results) => {
      if (err) throw err;
      req.flash("success", "Order sent successfully!");
      res.redirect("./property");
  });
});

router.get("/about", (req, res) => { res.render("./user/about"); });
router.get("/contact", (req, res) => { res.render("./user/contact"); });
router.post("/contact", (req, res) => { 
  var myData = req.body;
    
  console.log(myData);
  let sql = "INSERT INTO contact SET ?";
  let query = myconnection.query(sql, myData, (err, results) => {
      if (err) throw err;
      req.flash("success", "Message sent successfully!");
      res.redirect("./contact");
  });
  });

module.exports = router;
