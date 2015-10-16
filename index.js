var five = require("johnny-five");
var request = require('request');

var board = new five.Board();

// When the arduino board is ready then we can start polling codeship.
board.on("ready", function() {

var ardSetup = {
	buildOne: {
		branchname : "",
		REDPOWER: new five.Led(11),
		ORANGEPOWER: new five.Led(12),
		GREENPOWER: new five.Led(13)
	},
	buildTwo: {
		branchname: "",
		REDPOWER: new five.Led(10),
		ORANGEPOWER: new five.Led(9), 
		GREENPOWER: new five.Led(8)
	}
};

// The codeship api for our account.
var api_key = ''
// The codeship project that we want to query.
var project_id = ''

var baseurl = 'https://codeship.com/api/v1/projects/' + project_id +'.json?api_key=' + api_key

// We want to query codeship every 10 seconds.
setInterval(query, 10000);

function query(){
	for( var instance in ardSetup ){
		callCodeShip(instance);
	}
};

function callCodeShip(instance){
	// Completes the URL with the relevant branch name.
	url = baseurl + "&branch=" + ardSetup[instance].branchname
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    var fbResponse = JSON.parse(body)
		// Turn off all the LEDs to begin with.	
		ardSetup[instance].REDPOWER.off();
		ardSetup[instance].ORANGEPOWER.off();
		ardSetup[instance].GREENPOWER.off();
		// Turn on the relevant LED.
		if(fbResponse.builds[0].status == "success")
			ardSetup[instance].GREENPOWER.on();
		if(fbResponse.builds[0].status == "testing")
			ardSetup[instance].ORANGEPOWER.on();
		if(fbResponse.builds[0].status == "error")
			ardSetup[instance].REDPOWER.on();
	  } else {
	    console.log("Got an error: ", error);
	  }
	});
}
});