/* global Log, Module, moment */

/* Magic Mirror
 * Module: Compliments
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */
Module.register("MMM-ComplimentsExt", {

	// Module config defaults.
	defaults: {
		compliments: {
			anytime: [
				"Hey there sexy!"
			],
			morning: [
				"Good morning"
			],
			afternoon: [
				"Looking good today!"
			],
			evening: [
				"Have a good night!"
			]
		},
		updateFrequence: 30000,
		remoteFile: null,
		fadeSpeed: 4000,
		morningStartTime: 3,
		morningEndTime: 12,
		afternoonStartTime: 12,
		afternoonEndTime: 17,
		taskListDefault: {
			type: "NORMAL",
			updateInterval: 15 * 1000 * 60, // every 15 mins
			initialLoadDelay: 100, // start delay seconds
			color: "red",
		
		},
		maxNumberOfTasksDisplayed: 3,
		maxNumberOfUsualTasksDisplayed: 2,
		
		
	},

	// Set currentweather from module
	currentWeatherType: "",
	flagUrgentTask: false,
	urgentColorTask: "red",

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define start sequence.
	start: function() {
		var l, i;
		Log.info("Starting module: " + this.name);
		
		this.lastComplimentIndex = -1;
		this.flagUrgentTask = false;

		this.config.infos = [];
    	if (!this.config.lists) {
      		this.config.lists = [];
		}
		var self = this;
		
		
		//all lists are based on the template (defined here), superseded by the default value (define in config), superseded by specific value
		for (i=0; i < this.config.lists.length; i++) {
			this.config.infos[i]={};
			l = Object.assign(JSON.parse(JSON.stringify(this.config.taskListDefault)),
			  JSON.parse(JSON.stringify(this.config.listDefault || {})),
			  JSON.parse(JSON.stringify(this.config.lists[i])));
			l.id = i;
			this.config.lists[i] = l;
		 }
		this.sendSocketNotification('SET_CONFIG', this.config);
		this.loaded = false;

		if (this.config.remoteFile != null) {
			this.complimentFile(function(response) {
				self.config.compliments = JSON.parse(response);
				self.updateDom();
			});
		}
		// Schedule update timer.
		setInterval(function () {
		  self.caller = 'updateInterval';
		  self.updateDom(self.config.fadeSpeed);
		}, this.config.updateFrequence);

		
	},


	/* randomIndex(compliments)
	 * Generate a random index for a list of compliments.
	 *
	 * argument compliments Array<String> - Array with compliments.
	 *
	 * return Number - Random index.
	 */
	randomIndex: function(compliments) {
		if (compliments.length === 1) {
			return 0;
		}

		var generate = function() {
			return Math.floor(Math.random() * compliments.length);
		};

		var complimentIndex = generate();

		while (complimentIndex === this.lastComplimentIndex) {
			complimentIndex = generate();
		}

		this.lastComplimentIndex = complimentIndex;

		return complimentIndex;
	},

	/* IsLastWeek(Date)
	 * Determine if its the last week of the month.
	 *
	 * return Number - True or false.
	 */

	isLastWeek: function(fDate)
	{
		var WeekNumberInMonth = Math.ceil(fDate.date()/ 7);
	 	var LookAheadWeek = new moment(fDate);
	  
	// Determine if lastweek of the month.
	// if week number is 5 automatic return true, since its not possible to have 6 weeks.
		if (WeekNumberInMonth == 5) return true;
		// If not 4  we know its not last week of month and return false
		if (WeekNumberInMonth == 4) 
		   {
			// look ahead on week is it same month?
			LookAheadWeek.add(1, 'w');
			if (LookAheadWeek.month() == fDate.month()) 
			{
				return false;
			}
		    else return true;
		}
		 else return false;
		 
	 return false;
	 },

	/* complimentArray()
	 * Retrieve an array of compliments for the time of the day.
	 *
	 * return compliments Array<String> - Array with compliments for the time of the day.
	 */
	complimentArray: function() {
		var hour = moment().hour();
		var compliments;
		// For fix date and floating dates
		var ye_date = 'yearly_event_' + moment().format('MMDD');  // add functionality for yearly date
		var yfe_date = new moment();
		var yfe_date_str = "yearly_float_" + yfe_date.format("MM") + yfe_date.day() +  Math.ceil(yfe_date.date()/ 7);
		
		// Google Task variable handlers
		var gTask_list = this.config.lists;
		var gTask_listname,gTask_detail_date, gTask_detail,  i, j;
		var gtasktodate_str =  moment().format('MMDDYYYY');
		
		this.flagUrgentTask = false;
	
		// load morning, afternoon and evening events
		if (hour >= this.config.morningStartTime && hour < this.config.morningEndTime && this.config.compliments.hasOwnProperty("morning")) {
			compliments = this.config.compliments.morning.slice(0);
		} else if (hour >= this.config.afternoonStartTime && hour < this.config.afternoonEndTime && this.config.compliments.hasOwnProperty("afternoon")) {
			compliments = this.config.compliments.afternoon.slice(0);
		} else if(this.config.compliments.hasOwnProperty("evening")) {
			compliments = this.config.compliments.evening.slice(0);
		}

		if (typeof compliments === "undefined") {
			compliments = new Array();
		}
		
		// load weather related events
		if (this.currentWeatherType in this.config.compliments) {
			compliments.push.apply(compliments, this.config.compliments[this.currentWeatherType]);
		}

		// Look for yearly events 
		if (ye_date in this.config.compliments) {
			compliments.push.apply(compliments, this.config.compliments[ye_date]);
		} 

		// Look for floating events (e.g. event which occur thrid sunday in april)
		// Format: Month, Day of the week and week in the month or last week. Where Day of the week represented as
		/// Sunday as 0 and Saturday as 6. L is used to represent the last week of month.
		// yearly_float_0302 = March, Sunday, the 2nd week
		// yearly_float_030L = March, Sunday, the Last week
		if (yfe_date_str in this.config.compliments) {
			compliments.push.apply(compliments, this.config.compliments[yfe_date_str]);
		} 
		if (this.isLastWeek(yfe_date)) {
			yfe_date_str = "yearly_float_" + yfe_date.format("MM") + yfe_date.day() +  "L";
			if (yfe_date_str in this.config.compliments) {
				compliments.push.apply(compliments, this.config.compliments[yfe_date_str]);
			} 
		}

		// Get the the compliment/reminder from Google task list
		if (gTask_list.length > 0)
		{
			for (i = 0; i < gTask_list.length; i++) {
				gTask_listname = gTask_list[i];
				switch (gTask_listname.type) {
				case "NORMAL":
					  gIndividual_tasks = this.config.infos[i];
					  if (this.flagUrgentTask == false)
					  {
			  			for (j = 0; j < gIndividual_tasks.length; j++) {
							gTask_detail = gIndividual_tasks[j];
							// Get date and determine if it should be displayed
							gTask_detail_date = typeof gTask_detail.due == "undefined" ? new moment():new moment.utc(gTask_detail.due);

							// if task is schedule for today or no time add to list
							if (gTask_detail_date.format('MMDDYYYY') == gtasktodate_str)
							{
								compliments.push(gTask_detail.title);
								console.log("Normal Event Added: "+ gTask_detail.title); //Debug confirm event has been added
					 		}	
				  		
						}
					  }
					break;
				case "URGENT":
					gIndividual_tasks = this.config.infos[i];	
			  		for (j = 0; j < gIndividual_tasks.length; j++) {
						
						gTask_detail = gIndividual_tasks[j];
						
						// Get date and determine if it should be displayed
						gTask_detail_date = typeof gTask_detail.due == "undefined" ? new moment():new moment.utc(gTask_detail.due);

						// if task is schedule for today or no time add to list
						if (gTask_detail_date.format('MMDDYYYY') == gtasktodate_str)
						{
							// if this first entry then clear array and start adding events
							if(this.flagUrgentTask == false) compliments.length = 0; 
							compliments.push(gTask_detail.title);
							console.log("Urgent Event Added: "+ gTask_detail.title); //Debug confirm event has been added
							this.flagUrgentTask = true;
							this.urgentColorTask = gTask_listname.color;
					 	}	
					}
				break;
				}
			}
		}

		// Any time compliment array 
		if (this.flagUrgentTask == false)
			compliments.push.apply(compliments, this.config.compliments.anytime);

		
		return compliments;
	},

	/* complimentFile(callback)
	 * Retrieve a file from the local filesystem
	 */
	complimentFile: function(callback) {
		var xobj = new XMLHttpRequest(),
			isRemote = this.config.remoteFile.indexOf("http://") === 0 || this.config.remoteFile.indexOf("https://") === 0,
			path = isRemote ? this.config.remoteFile : this.file(this.config.remoteFile);
		xobj.overrideMimeType("application/json");
		xobj.open("GET", path, true);
		xobj.onreadystatechange = function() {
			if (xobj.readyState == 4 && xobj.status == "200") {
				callback(xobj.responseText);
			}
		};
		xobj.send(null);
	},

	/* complimentArray()
	 * Retrieve a random compliment.
	 *
	 * return compliment string - A compliment.
	 */
	randomCompliment: function() {
		var compliments = this.complimentArray();
		var index = this.randomIndex(compliments);

		return compliments[index];
	},

	// Override dom generator.
	getDom: function() {
		var complimentText = this.randomCompliment();
		
		var compliment = document.createTextNode(complimentText);
		var wrapper = document.createElement("div");
		wrapper.className = this.config.classes ? this.config.classes : "thin xlarge bright";
		// If urgent compliment highlight in red
		if (this.flagUrgentTask)
			wrapper.setAttribute('style',  "color: " + this.urgentColorTask);
		wrapper.appendChild(compliment);
		return wrapper;
	},


	// From data currentweather set weather type
	setCurrentWeatherType: function(data) {
		var weatherIconTable = {
			"01d": "day_sunny",
			"02d": "day_cloudy",
			"03d": "cloudy",
			"04d": "cloudy_windy",
			"09d": "showers",
			"10d": "rain",
			"11d": "thunderstorm",
			"13d": "snow",
			"50d": "fog",
			"01n": "night_clear",
			"02n": "night_cloudy",
			"03n": "night_cloudy",
			"04n": "night_cloudy",
			"09n": "night_showers",
			"10n": "night_rain",
			"11n": "night_thunderstorm",
			"13n": "night_snow",
			"50n": "night_alt_cloudy_windy"
		};
		this.currentWeatherType = weatherIconTable[data.weather[0].icon];
	},


	// Override notification handler.
	notificationReceived: function(notification, payload, sender) {
		if (notification == "CURRENTWEATHER_DATA") {
			this.setCurrentWeatherType(payload.data);
		}
	},

	socketNotificationReceived: function(notification, payload) {
		var now = new Date();
		this.caller = notification;
		switch (notification) {
		  case "DATA":
			this.config.infos = payload;
			if (!this.loaded) 
			{
			  this.loaded = true;
			}
			this.updateDom();
			console.log (this.config.infos);  // log oject to console informaiton
			break;
		}
	  },

});
