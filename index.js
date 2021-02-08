// Run these commands in Redis
// geoadd va-universities -76.493 37.063 christopher-newport-university
// geoadd va-universities -76.706944 37.270833 college-of-william-and-mary
// geoadd va-universities -78.868889 38.449444 james-madison-university
// geoadd va-universities -78.395833 37.297778 longwood-university
// geoadd va-universities -76.2625 36.8487 norfolk-state-university
// geoadd va-universities -76.30522 36.88654 old-dominion-university
// geoadd va-universities -80.569444 37.1275 radford-university
// geoadd va-universities -77.475 38.301944 university-of-mary-washington
// geoadd va-universities -78.478889 38.03 university-of-virginia
// geoadd va-universities -82.576944 36.978056 uva-wise
// geoadd va-universities -77.453255 37.546615 virginia-commonwealth-university
// geoadd va-universities -79.44 37.79 virginia-military-institute
// geoadd va-universities -77.425556 37.242778 virginia-state-university
// geoadd va-universities -80.425 37.225 virginia-tech

// This is the long-hand way of adding multiple entries, but it’s good to see the pattern.
// This is an example of the short-hand representation of the last two items:
// geoadd  va-universities -77.425556 37.242778 virginia-state-university -80.425 37.225 virginia-tech

// Internally, these geo items aren’t actually anything special—they are stored by Redis as a zset,
// or sorted set. To show this, let’s run a few more commands on the key va-universities:
// TYPE va-universities
// let’s look at the GEODIST command. With this command, you can determine the distance between two points that you’ve previously entered under the same key.
// So, let’s find the distance between the members virginia-tech and  christopher-newport-university:
// GEODIST va-universities virginia-tech christopher-newport-university
// This should output 349054.2554687438, or the distance between the two places in meters. You can also supply a third argument as a unit mi (miles), km (kilometers), ft (feet), or m (meters, the default). Let’s get the distance in miles:
// GEODIST va-universities virginia-tech christopher-newport-university mi



// Most of the time we’re going to want all the points within a certain radius of a location,
// not just the distance between two points. We can do this with the GEORADIUS command.
// The GEORADIUS command expects, at least, the key, longitude, latitude, distance, and a unit.
// So, let’s find all the universities in the dataset within 100 miles of this point. 
// GEORADIUS va-universities -78.245278 37.496111 100 mi
// Which returns:
// 1) "longwood-university"
// 2) "virginia-state-university"
// 3) "virginia-commonwealth-university"
// 4) "university-of-virginia"
// 5) "university-of-mary-washington"
// 6) "college-of-william-and-mary"
// 7) "virginia-military-institute"
// 8) "james-madison-university”



// GEORADIUSBYMEMBER works exactly the same as the GEORADIUS,
// but instead of specifying a longitude and a latitude in the arguments,
// you can specify a member already in your key.
// So this, for example, will return all the members
// within 100 miles of the member university-of-virginia.



// GEORADIUSBYMEMBER va-universities university-of-virginia 100 mi
// you may have wondered how to get the coordinates back out of a position you added with
// GEOADD—we can accomplish this with the GEOPOS command. 
// By supplying the key and a member, we can get back out the coordinates:
// GEOPOS va-universities university-of-virginia
// Which should yield a result of:

//    1) "-78.478890359401703"
//    2) “38.029999417483971"

var  bodyParser  = require('body-parser'); 
var  express     = require('express');
const  redis      = require('redis');
// const { client }       = require('redis');
var app = express();
app.use(bodyParser.json())
client = redis.createClient();
app.set('view engine', 'pug'); //this associates the pug module with the res.render function

app.get(  // method "get"
  '/',    // the route, aka "Home"
  function(req, res) {
    res.render('index', { //you can pass any value to the template here
      pageTitle: 'University Finder' 
    });
  }
);
app.post( // method "post"
  '/', 
  bodyParser.urlencoded({ extended : false }), // this allows us to parse the values POST'ed from the form
  function(req,res,next) {
    var latitude  = req.body.latitude;    // req.body contains the post values
    var  longitude = req.body.longitude;
    console.log("longitude ",longitude)
    console.log("latitude ",latitude)
     client.georadius(
      'va-universities',    //va-universities is the key where our geo data is stored
      longitude,            //the longitude from the user
      latitude,             //the latitude from the user
      '100',                //radius value
      'mi',                 //radius unit (in this case, Miles)
      'WITHCOORD',          //include the coordinates in the result
      'WITHDIST',           //include the distance from the supplied latitude & longitude
      'ASC',                //sort with closest first
      function(err, results) {
        if (err) { next(err); } else { //if there is an error, we'll give it back to the user
          //the results are in a funny nested array. Example:
          //1) "longwood-university"        [0]
          //2) "16.0072"                    [1]
          //3)  1) "-78.395833075046539"    [2][0]
          //    2) "37.297776773137613"     [2][1]
          //by using the `map` function we'll turn it into a collection (array of objects)
          results = results.map(function(aResult) {
            console.log("Here is a result ")
            var
              resultObject = {
                key       : aResult[0],
                distance  : aResult[1],
                longitude : aResult[2][0],
                latitude  : aResult[2][1]
              };
              
            return resultObject;
          })
          res.render('index', { 
            pageTitle : 'University Finder Results',
            latitude  : latitude,
            longitude : longitude,
            results   : results
          });
        }
      }
    );
    
  }
);

app.listen(3000, function () {
  console.log('Sample store finder running on port 3000.');
});


// Most users don’t think in terms of coordinates, so you’ll need to consider a more user-friendly approach such as:
// 1. Using client-side JavaScript to detect the location using the Geolocation API
// 2. Using an IP-based geolocator service
// 3. Ask the user for a postal code or address and use a geocoding service that converts either into coordinates. Many different geocoding services are on the market, so pick one that works well for your target area.

// Expand the location key into more useful information. If you are using Redis to store more information about each location, consider storing that information in hashes with a key that matches your returned members from GEORADIUS.
// You'll need to make additional call(s) to Redis.