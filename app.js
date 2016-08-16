var express = require('express');
var path = require("path");
var mongojs = require("mongojs");
var request = require('request');
var moment = require("moment");

var cx = process.env.CX;
var apikey = process.env.APIKEY;
var databaseUrl = process.env.MLAB_URI || "image-search";

var app = express();

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/api/latest", function (req, res) {
    var db = mongojs(databaseUrl, ["images"]);
    db.images.find({}, {_id: false}).sort({$natural: -1}).limit(10, function (err, results) {
        res.json({
            results
        });
    });
});

app.get("/api/imagesearch/:query", function (req, res) {
    var query = req.params.query;
    var offset = req.query.offset;

    if (offset == null) {
        offset = 10;
    }

    var dataEntry = {
        query: query,
        when: moment().format("dddd, MMMM Do YYYY, h:mm:ss a")
    }

    var url = "https://www.googleapis.com/customsearch/v1?searchType=image&num=" + offset +"&key=" + apikey + "&cx=" + cx + "&q=" + query;

    request(url, { json: true }, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            var results = [];

            for (var i = 0; i < offset; i++) {
                results.push({
                    text: body.items[i].snippet,
                    image: body.items[i].link,
                    thumbnail: body.items[i].image.thumbnailLink,
                    context: body.items[i].image.contextLink
                });
            }

            var db = mongojs(databaseUrl, ["images"]);
            db.images.insert(dataEntry, function(err, result) {
                err ? console.log(err) : console.log("New link added to database")
            });

            res.json({
                query: query,
                offset: offset,
                results: results
            });
        } else {
            res.json({
                error: "There was an error getting the images. I might've gone over my free limit"
            })
        }
    });
});

app.listen(process.env.PORT || 3000, function () {
    console.log('App Started!');
});
