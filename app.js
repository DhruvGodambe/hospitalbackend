var express = require("express")
var app = express();
var mysql = require("mysql")
var bodyParser = require("body-parser")
var session = require("express-session")
var flash = require("express-flash");
var MySQLStore = require('express-mysql-session')(session);

var options = {
	host: 'localhost',
	user: 'root',
	password: 'Godambe@66',
	database: 'Hospital'
}
var sessionStore = new MySQLStore(options);

var conn = mysql.createPool({
    host: "us-cdbr-east-02.cleardb.com",
    user: "b5b859b5b989ce",
    password: "5c9fa3aa",
    database: "heroku_6e01da75dfdc3b9"
})
// var sqlQuery = 'create table bed(id INT(3) AUTO_INCREMENT PRIMARY KEY, type VARCHAR(100), ventilator BOOLEAN)'
// var sqlQuery = 'create table patient(id INT(3) AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), complaint VARCHAR(100), phone VARCHAR(12), address VARCHAR(200))'
// var sqlQuery = 'create table hospital(id INT(3) AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), incharge VARCHAR(100), phone VARCHAR(12), address VARCHAR(200))'
app.use(bodyParser.urlencoded({extended: true}))
app.set('view engine', 'ejs')
app.use(session({
    store: sessionStore,
    secret: "use of mysql javascript html and css",
    resave: false,
    saveUninitialized: false
}))
app.use(flash())

app.get("/", function(req, res){
    res.sendFile(__dirname + '/frontend/home.html')
})

app.get("/list", function(req, res){
    conn.query("SELECT * FROM hospital", function(err, result){
        if(err){
            res.send(err)
        } else {
            console.log(result);
            if(req.session.loggedIn){
                res.render('front_end-2.ejs', {obj: { message: req.flash("list"), result }})
            } else {
                req.flash('login', 'please login or register first')
                res.redirect("/login")
            }
        }
    })
})

app.get("/login", function(req, res){
    if(req.session.loggedIn){
        req.flash("list", "already logged in")
        res.redirect("/list")
    } else {
        res.render('front_end-1.ejs', {message: req.flash('login')})
    }
})

app.post("/login", function(req, res){
    conn.query("SELECT * FROM patient", function(err, result){
        console.log(result);
        if(err){
            console.log(err)
            res.send("ERROR OCCURED!!")
        } else {
            console.log(result)
            result.forEach(val => {
                if(val.name === req.body.name && val.password === req.body.password){
                    req.session.user = val;
                    req.session.loggedIn = true;
                    console.log(req.session)
                } else {
                    console.log(req.body)
                    console.log("not ", val.name, val.password)
                }
            })
            if(req.session.loggedIn){
                res.redirect("/list")
            } else {
                res.redirect("/login")
            }
        }
    })
})

app.post("/register", function(req, res){
    var data = req.body;
    var sql = `INSERT INTO patient(name, phone, complaint, address, password) VALUES('${data.fname} ${data.lname}', '${data.phone}', '${data.complaint}', '${data.address}', '${data.password}')`
    conn.query(sql, function(err, result){
        if(err){
            console.log(err)
            res.send("ERROR OCCURED!!")
        } else {
            console.log("patient recorded")
            req.session.user = result;
            req.session.loggedIn = true;
            res.redirect("/list")
        }
    })
})

app.post("/book", function(req, res){
    req.session.hospital = req.body;
    res.render("booking_details");
})

app.post("/booked", function(req, res){
    var sql = `INSERT INTO bed(type,ventilator,patient_id,hospital_id) VALUES('${req.body.bed}', ${req.body.ventilator == 'true'}, ${req.session.user.id}, ${req.session.hospital.id})`
    conn.query(sql, function(err, result){
        if(err){
            console.log(err)
        } else {
            conn.query(`UPDATE hospital SET beds=beds-1 WHERE id=${req.session.hospital.id}`, function(error, resp){
                if(error){
                    console.log(error)
                } else {
                    res.render("booked", {obj: {user: req.session.user, hospital: req.session.hospital}})
                }
            })
        }
    })
})

app.get("/patient_list", function(req, res){
    conn.query("SELECT * FROM patient", function(err, result){
        if(err){
            console.log(err)
            res.send("ERROR OCCURED!!")
        } else {
            console.log('list: ', result)
            res.render("patient_list", {list: result})
        }
    })
})

app.get("/logout", function(req, res){
    req.session.loggedIn = false;
    req.session.user = {};
    res.redirect("/")
})

app.listen(process.env.PORT || 8080, function(){
    console.log("server started...")
})