var express         = require("express");
var router          = express.Router();
var Campground      = require("../models/campground");
var middleware      = require("../middleware/index");

//Google Maps Config
var NodeGeocoder    = require('node-geocoder');
var options         = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
var geocoder        = NodeGeocoder(options);

// Image Upload Config
var multer          = require("multer");
var storage         = multer.diskStorage({
    filename: function(req, file, callback){
        callback(null, Date.now() + file.originalname);    
    } 
});
var imageFilter     = function(req, file, cb){
    //only accepts image files
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};
var upload          = multer({ storage: storage, fileFilter: imageFilter});
var cloudinary      = require("cloudinary");
cloudinary.config({
   cloud_name: "thedodus",
   api_key: "836119755898384",
   api_secret: "rlY4kuhGwfhRzlaSieQnYSOFeM0"
});

//====ROUTES=================================================
// Campgrounds /index
router.get("/campgrounds", function(req, res){
    //handling searches 
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), "gi");
        //search db for campground
        Campground.find({name: regex}, function(err, foundCampgrounds){
            if(err){
                console.log(err);
            } else {
                //error if nothing found
                if(foundCampgrounds.length < 1){
                    req.flash("error", "No matching campgrounds found."); 
                    res.redirect("back");
                } else {
                    //render campgrounds page with data pulled from DB
                    res.render("campgrounds/index", {campgrounds: foundCampgrounds, page: "campgrounds"});    
                }
            }
        });     
    } else {
        //if no search then an empty search will pull all campgrounds from db
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            } else {
                //render campgrounds page with data pulled from DB
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds"});
            }
        });  
    }
});

// Campgrounds /new
router.get("/campgrounds/new", middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new");
});

//CREATE - add new campground to DB
router.post("/campgrounds", middleware.isLoggedIn, upload.single("image"), function(req, res){
  // get data from form and add to campgrounds array
    //set image to be cloudinary url
    cloudinary.v2.uploader.upload(req.file.path, function(err, result){
        if(err){
            req.flash('error', "There was a problem with your image.");
            return res.redirect('back');
        }
        var image = result.secure_url;
        var imageId = result.public_id;
        var name = req.body.name;
        var desc = req.body.description;
        var author = {
            id: req.user._id,
            username: req.user.username
        };
        geocoder.geocode(req.body.location, function (err, data) {
            if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
            }
            var lat = data[0].latitude;
            var lng = data[0].longitude;
            var location = data[0].formattedAddress;
            var newCampground = {name: name, image: image, imageId: imageId, description: desc, author:author, location: location, lat: lat, lng: lng};
            // Create a new campground and save to DB
            Campground.create(newCampground, function(err, newlyCreated){
                if(err){
                    console.log(err);
                } else {
                    //redirect back to campgrounds page
                    console.log(newlyCreated);
                    res.redirect("/campgrounds");
                }
            });
        });
    });
});

// SHOW  Campgrounds /show
router.get("/campgrounds/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// EDIT Campground route
router.get("/campgrounds/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
            req.flash("error", "Campground not found in database.");
            res.redirect("back");
        }
        else {
            res.render("campgrounds/edit", {campground: foundCampground});   
        }
    });
});

// UPDATE CAMPGROUND ROUTE
router.put("/campgrounds/:id", middleware.checkCampgroundOwnership, upload.single("image"), function(req, res){
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        if(req.file){
            Campground.findById(req.params.id, function(err, campground){
                if(err){
                    req.flash("error", "Campground could not be found");
                    return res.redirect("back");
                }
                if(campground.imageId){
                    cloudinary.v2.uploader.destroy(campground.imageId, function(err){
                        if(err){
                            req.flash("error", "Something went wrong deleting previous image");
                            return res.redirect("back");
                        }     
                    });
                }
                cloudinary.v2.uploader.upload(req.file.path, function(err, result){
                    if(err){
                        req.flash("error", "Something went wrong wth new image");
                        return res.redirect("back");
                    }
                        campground.imageId = result.public_id;
                        campground.image  = result.secure_url;
                        campground.name = req.body.campground.name;
                        campground.description = req.body.campground.description;
                        campground.price = req.body.campground.price;
                        campground.save();
                        req.flash("success","Successfully Updated!");
                        res.redirect("/campgrounds/" + campground._id);
                    });
                });
        } else {
            Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
                if(err){
                    req.flash("error", err.message);
                    res.redirect("back");
                } else {
                    req.flash("success","Successfully Updated!");
                    res.redirect("/campgrounds/" + campground._id);
                }
            });    
        }
        
    });
});

//  DELETE Campground Route

router.delete("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            req.flash("error", err.message);
            return res.redirect("back");
        }
        if(campground.imageId){
            cloudinary.v2.uploader.destroy(campground.imageId);
        }
        campground.remove();
        req.flash("success", "Succesfully deleted campground.");
        res.redirect("/campgrounds");
    });
});

//old working 
// router.delete("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res){
//     Campground.findByIdAndRemove(req.params.id, function(err){
//         if(err){
//             console.log(err);
//             res.redirect("/campgrounds");
//         } else {
            
//             req.flash("success", "Succesfully deleted campground.");
//             res.redirect("/campgrounds");
//         }
//     });
// });

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;