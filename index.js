var five = require("johnny-five");
var request = require('request');
var config = require('./config')
var board = new five.Board();

// When the arduino board is ready then we can start polling codeship.
board.on("ready", function() {

var ardSetup = {
	buildOne: {
		lastBuild: 0,
		branchname : "",
		REDPOWER: new five.Led(11),
		ORANGEPOWER: new five.Led(12),
		GREENPOWER: new five.Led(13),
		buildButton: new five.Button(2)
	},
	buildTwo: {
		lastBuild: 0,
		branchname: "",
		REDPOWER: new five.Led(10),
		ORANGEPOWER: new five.Led(9), 
		GREENPOWER: new five.Led(8),
		buildButton: new five.Button(3)
	}
};

for( var instance in ardSetup ){
	// Allow the button to know what instance its associated with.
	ardSetup[instance].buildButton.instance = instance

	ardSetup[instance].buildButton.on("down", function() {
		console.log(this.instance);
		// When a button is pressed we want to rerun the last build
		// of the branch its associated with.
		rerunLastBuild(this.instance);
	});
}

var baseurl = 'https://codeship.com/api/v1/projects/' + config.project_id +'.json?api_key=' + config.api_key



// We want to query codeship every 10 seconds.
setInterval(query, 10000);

// For every instance/branch query codeship and update the LEDs.
function query(){
	for( var instance in ardSetup ){
		callCodeShip(instance);
	}
};

// Call the codeship api for a specific branch.
function callCodeShip(instance){
	// Completes the URL with the relevant branch name.
	url = baseurl + "&branch=" + ardSetup[instance].branchname
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    var fbResponse = JSON.parse(body)
	    if(fbResponse.builds.length > 0){
		    ardSetup[instance].lastBuild = fbResponse.builds[0].id;
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
		}
	  } else {
	    console.log("Got an error: ", error);
	  }
	});
}


function rerunLastBuild(instance){
	console.log("rerunLastBuild", instance);
	console.log(ardSetup[instance].lastBuild)
	if( ardSetup[instance].lastBuild === 0)
		return

	// Restart build url
	url = "https://codeship.com/api/v1/builds/" + ardSetup[instance].lastBuild + "/restart.json?api_key=" + config.api_key	
	console.log(url);
	request({url: url, method: "POST"}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
    		var fbResponse = JSON.parse(body);
    		console.log(fbResponse);
		}
		else{
			console.log("Error time: ", error)
		}
	});
}
});