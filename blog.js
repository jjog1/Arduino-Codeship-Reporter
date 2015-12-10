var five = require("johnny-five");
var request = require('request');
var config = require('./config')
var board = new five.Board();

board.on("ready", function() {
	// Create 3 variables for the LEDS and create new johnny-five led objects.
	var REDPOWER = new five.Led(11);
	var ORANGEPOWER = new five.Led(12);
	var GREENPOWER = new five.Led(13);

	// lastBuild keeps track of the last build Id so when the button is pressed
	// we can trigger it to rerun the tests.
	var lastBuild = 0

	// Create a button object, we'll use this to rerun the last build.
	var buildButton = new five.Button(2);

	// Attach the event to be triggered when the button is pressed.
	buildButton.on("down", function() {
		// If the last build is 0 we haven't received any information from 
		//Codeship yet so we don't want to try and run the last build.
		if(lastBuild === 0){
			return;
		}

		// Restart build url
		url = "https://codeship.com/api/v1/builds/" + lastBuild + 
			"/restart.json?api_key=" + config.api_key	
			
		request({url: url, method: "POST"}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
	    		// It doesn't really matter whats returned here
	    		// It's triggered the tests thats all that matters.
			}
			else{
				// Somethings gone wrong. Oops.
				console.log("Error time: ", error)
			}
		});
	});

	// We want to query codeship every 10 seconds.
	setInterval(callCodeShip, 10000);

	// The call to Codeship
	function callCodeShip(){
		url = 'https://codeship.com/api/v1/projects/' + config.project_id +'.json?api_key=' + config.api_key
		 + "&branch=" + config.branch_name 
		request(url, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
		    var fbResponse = JSON.parse(body)
		    // We have a good response so lets change the LEDs
		    if(fbResponse.builds.length > 0){
			    // The build in position 0 is the latest build.
			    // So we want to remember that Id.
			    lastBuild = fbResponse.builds[0].id;
			    
				// Turn off all the LEDs to begin with.	
				REDPOWER.off();
				ORANGEPOWER.off();
				GREENPOWER.off();
				// Turn on the relevant LED.
				if(fbResponse.builds[0].status == "success")
					GREENPOWER.on();
				if(fbResponse.builds[0].status == "testing")
					ORANGEPOWER.on();
				if(fbResponse.builds[0].status == "error")
					REDPOWER.on();
			}
		  } else {
		    console.log("Got an error: ", error);
		  }
		});
	}
});