require('dotenv').config();

// ---------VAR SET UP--------------
var express                 = require("express"),
    app                     = express(),
    bodyParser              = require("body-parser"),
    mongoose                = require("mongoose"),
    passport                = require("passport"),
    flash                   = require("connect-flash"),
    LocalStrategy           = require("passport-local"),
    methodOverride          = require("method-override"),
    Campground              = require("./models/campground"),
    Comment                 = require("./models/comment"),
    User                    = require("./models/user"),
    passportLocalMongoose   = require("passport-local-mongoose");
    

// ----REQUIRING ROUTES

var campgroundRoutes    = require("./routes/campgrounds"),
    commentRoutes       = require("./routes/comments"),
    indexRoutes         = require("./routes/index");

//--------APP CONFIG-----------------
mongoose.connect("mongodb://localhost:27017/yelp_camp_final", { useNewUrlParser: true })
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');

//-------PASSPORT CONFIG---------
app.use(require("express-session")({
    secret: "Rigsby dog Rigsby dog, I love you",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(indexRoutes);
app.use(campgroundRoutes);
app.use(commentRoutes);

// ---------SERVER--------------
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Yelp Camp is running...");
});