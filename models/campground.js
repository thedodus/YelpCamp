var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    name: String,
    price: String,
    image: String,
    imageId: String,
    createdAt: { type: Date, default: Date.now },
    location: String,
    lat: Number,
    lng: Number,
    description: String,
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

module.exports = mongoose.model("Campground", campgroundSchema);