var express = require('express');
var path = require("path");
var mongojs = require("mongojs");
var request = require('request');

var cx = process.env.CX;
var apikey = process.env.APIKEY;
var databaseUrl = process.env.MLAB_URI || "image-search";
var db = mongojs(databaseUrl, ["urls"]);

var app = express();

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/api/latest", function (req, res) {
    res.json([
        {
            term: "Stuff",
            when: "How do I know"
        },
        {
            term: "More stuff",
            when: "Sometime ago"
        }
    ]);
});

app.get("/api/imagesearch/:query", function (req, res) {
    var query = req.params.query;
    var offset = req.query.offset == null ? 10 : req.query.offset;
    var url = "https://www.googleapis.com/customsearch/v1?searchType=image&key=" + apikey + "&cx=" + cx + "&q=" + query;

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
