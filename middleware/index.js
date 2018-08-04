var Campground  = require("../models/campground");
var Comment     = require("../models/comment");

//all the middleware goes here

var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You must be logged in to do that.");
    res.redirect("/login");
};


middlewareObj.checkCampgroundOwnership = function(req, res, next){
    if(req.isAuthenticated()){
         Campground.findById(req.params.id, function(err, foundCampground){
            if(err){
                console.log(err);
                req.flash("error", "Campground not found.");
                res.redirect("back");
            } else {
                if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();   
                }
                else {
                    req.flash("error", "You don't have permission to edit this campground.");
                    res.redirect("back");
                }   
            }
        });
    }
    else {
        req.flash("error", "You need to be logged in to do that.");
        res.redirect("back");
    }
};

middlewareObj.checkCommentOwnership = function(req, res, next){
    // is user logged in
    if(req.isAuthenticated()){
    // is user the campground author
         Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                console.log(err);
                req.flash("error", "Something went wrong");
                res.redirect("back");
            } else {
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();   
                }
                else {
                    req.flash("error", "You do not have permission to do that.");
                    res.redirect("back");
                }   
            }
        });
    }
    else {
        req.flash("error", "You need be be logged in to do that!");
        res.redirect("back");
    }
};


module.exports = middlewareObj;