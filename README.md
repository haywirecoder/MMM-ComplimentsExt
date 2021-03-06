# Module: ComplimentsExt
The `compliments` module is one of the default modules of the MagicMirror.
This module displays a random compliment, within the configuration file, remote file and/or from Google Task list

# Google Tasks setup

1. A google account is required
2. follow this [instruction to Turn on the Google Tasks API](https://developers.google.com/tasks/quickstart/nodejs) and get your file `credentials.json` .
3. Put this file in the module folder. Erase any `token.json` file (that would have been previously set-up, in particular if you change account or had an issue).
5. When first launching the module (doing npm start at the magicmirror level for example), look at the console
6. A link should be seen in the console, open it in your browser, login as the Google account you want to use the Google tasks from,
7. it should then display a consent code, copy and paste it back in the terminal.
8. If everything went smoothly, a list of your lists in google Tasks should be displayed

# Install

1. Clone repository into `../modules/` inside your MagicMirror folder.
2. git clone https://github.com/haywirecoder/MMM-ComplimentsExt/ MMM-ComplimentsExt
3. cd MMM-ComplimentsExt


## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: "compliments",
		position: "lower_third",	// This can be any of the regions.
									// Best results in one of the middle regions like: lower_third
		config: {
			// The config property is optional.
			// If no config is set, the default compliments are shown.
			// See 'Configuration options' for more information.
		}
		lists: [
				{
					name: 'MM Compliments',   
					updateInterval: 15 * 1000 * 60,  // every 15 mins -- update frequency for specific task list 
				},
				{
					type: 'URGENT', // Optional flag to indicate overright all compliment and only show this list.
					color: 'green', // Only valid with "urgent" type. 
					name: 'MM Urgent',  
					updateInterval: 1000 * 60 * 5 * 1, //every 5 mins minutes
				}
			],						 
		},
	}
]
````

## Configuration options

The following properties can be configured:


| Option           | Description
| ---------------- | -----------
| `updateFrequence` | How often does the compliment have to change? (Milliseconds) <br><br> **Possible values:** `1000` - `86400000` <br> **Default value:** `30000` (30 seconds)
| `fadeSpeed`      | Speed of the update animation. (Milliseconds) <br><br> **Possible values:**`0` - `5000` <br> **Default value:** `4000` (4 seconds)
| `compliments`	   | The list of compliments. <br><br> **Possible values:** An object with four arrays: `morning`, `afternoon`, `evening` and `anytime`. See _compliment configuration_ below. <br> **Default value:** See _compliment configuration_ below.
| `remoteFile`     | External file from which to load the compliments <br><br> **Possible values:** Path or URL (starting with `http://` or `https://`) to a JSON file containing compliments, configured as per the value of the _compliments configuration_ (see below). An object with four arrays: `morning`, `afternoon`, `evening` and `anytime`. - `compliments.json` <br> **Default value:** `null` (Do not load from file)
| `classes`        | Override the CSS classes of the div showing the compliments <br><br> **Default value:** `thin xlarge bright`
| `morningStartTime`        |  Time in hours (in 24 format), after which the mode of "morning" will begin <br> **Possible values:** `0` - `24` <br><br> **Default value:** `3`
| `morningEndTime`        |  Time in hours (in 24 format), after which the mode of "morning" will end <br> **Possible values:** `0` - `24` <br><br> **Default value:** `12`
| `afternoonStartTime`        | Time in hours (in 24 format), after which the mode "afternoon" will begin <br> **Possible values:** `0` - `24` <br><br>  **Default value:** `12`
| `afternoonEndTime`        | Time in hours (in 24 format), after which the mode "afternoon" will end <br> **Possible values:** `0` - `24` <br><br> **Default value:** `17`

All the rest of the time that does not fall into the morningStartTime-morningEndTime and afternoonStartTime-afternoonEndTime ranges is considered "evening".

## lists array

* `name`: mandatory: name of the list of tasks
* `type`: optional: NORMAL | URGENT determine if only task list should be displayed
* `updateInterval`: optional: integer: number of ms to wait between two information request, default: `1 * 60 * 1000 * 60 * 6` 6 hours
* `color`: optional: display code for urgent task list items. Default to 'red'

### Compliment configuration

The `compliments` property contains an object with four arrays: <code>morning</code>, <code>afternoon</code>, <code>evening</code> and <code>anytime</code>. Based on the time of the day, the compliments will be picked out of one of these arrays. The arrays contain one or multiple compliments.


If use the currentweather is possible use a actual weather for set compliments. The availables properties are:
* `day_sunny`
* `day_cloudy`
* `cloudy`
* `cloudy_windy`
* `showers`
* `rain`
* `thunderstorm`
* `snow`
* `fog`
* `night_clear`
* `night_cloudy`
* `night_showers`
* `night_rain`
* `night_thunderstorm`
* `night_snow`
* `night_alt_cloudy_windy`

#### Example use with currentweather module
````javascript
config: {
	compliments: {
		day_sunny: [
			"Today is a sunny day",
			"It's a beautiful day"
		],
		snow: [
			"Snowball battle!"
		],
		rain: [
			"Don't forget your umbrella"
		]
	}
}
````


#### Default value:
````javascript
config: {
	compliments: {
		anytime: [
			"Hey there sexy!"
		],
		morning: [
			"Good morning, handsome!",
			"Enjoy your day!",
			"How was your sleep?"
		],
		afternoon: [
			"Hello, beauty!",
			"You look sexy!",
			"Looking good today!"
		],
		evening: [
			"Wow, you look hot!",
			"You look nice!",
			"Hi, sexy!"
		]
	}
}
````

### External Compliment File
You may specify an external file that contains the three compliment arrays. This is particularly useful if you have a
large number of compliments and do not wish to crowd your `config.js` file with a large array of compliments.
Adding the `remoteFile` variable will override an array you specify in the configuration file.

This file must be straight JSON. Note that the array names need quotes
around them ("morning", "afternoon", "evening", "snow", "rain", etc.).
#### Example compliments.json file:
````json
{
    "anytime" : [
        "Hey there sexy!"
    ],
    "morning" : [
        "Good morning, sunshine!",
        "Who needs coffee when you have your smile?",
        "Go get 'em, Tiger!"
    ],
    "afternoon" : [
        "Hitting your stride!",
        "You are making a difference!",
        "You're more fun than bubble wrap!"
    ],
    "evening" : [
        "You made someone smile today, I know it.",
        "You are making a difference.",
        "The day was better for your efforts."
    ]
}
````

