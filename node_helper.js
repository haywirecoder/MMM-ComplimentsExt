/* Magic Mirror
 * Module: MMM-Buller
 * https://github.com/MichMich/MagicMirror/blob/master/modules/README.md module development doc
 *
 * script from da4throux
 * MIT Licensed.
 *
 */


//G: from Google Developer example: https://developers.google.com/tasks/quickstart/nodejs
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/tasks.readonly'];

const NodeHelper = require("node_helper");
var serverSide = [];

process.on('unhandledRejection', (reason, p) => {
  console.log('Logging unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
})

module.exports = NodeHelper.create({
  start: function() {
    var self = this;
    this.googleAuthReady = false;
    this.started = false;
    //this.path = 'modules/MMM-Buller/'; //already defined in MM modules
    this.TOKEN_PATH = this.path + '/token.json';
  },

  /**
   * Lists the user's first 10 task lists.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  getTaskLists: function(auth) {
    var self = this;
    
    this.gTasksAPI = google.tasks({version: 'v1', auth});
    this.gTasksAPI.tasklists.list({
      maxResults: 10,
    }, (err, res) => {
        if (err) return console.error('The API returned an error: ' + err);
        self.googleAuthReady = true;
        const taskLists = res.data.items;
        if (taskLists) {
          self.gTasksLists = [];
          self.gTasks=[];
          console.log('Task lists:');
          taskLists.forEach((taskList) => {
            self.gTasks[taskList.title] = taskList.id;
            console.log(`${taskList.title} (${taskList.id})`);
          });
        } else {
          console.log('No task lists found.');
        }
      });
  },
  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  authorize: function(credentials, callback) {
    var self = this;
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(self.TOKEN_PATH, (err, token) => {
      if (err) return self.getNewToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      self.oAuth2Client = oAuth2Client;
      callback(oAuth2Client);
    });
  },
  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback for the authorized client.
   */
  getNewToken: function(oAuth2Client, callback) {
    var self = this;
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(self.TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log('Token stored to', self.TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  },

  getTasksFromList: function (listDescription) {
    var self = this;
//    this.gTasksAPI.tasks.list.get({
   
    self.gTasksAPI.tasks.list({
      tasklist: self.gTasks[listDescription.name],
      maxResults: 10,
    }, (err, res) =>  {
        if (err) return console.error('The API returned an error: ' + err);
        const tasks = res.data.items;
        self.config.tasksFetched = [];
        
        if (tasks) {
          tasks.forEach((task) => {
            self.config.tasksFetched.push(task);
          })
          if (JSON.stringify(self.config.infos[listDescription.id]) !== JSON.stringify(self.config.tasksFetched)) {
            self.config.infos[listDescription.id] = self.config.tasksFetched;
          }
        } else {
          console.log('No tasks found in list.');
          self.config.infos[listDescription.id] = [];
        }
        self.sendSocketNotification("DATA", self.config.infos);
      })
  },

  socketNotificationReceived: function(notification, payload) {
    var self = this;
    if (notification === 'SET_CONFIG' && this.started == false) {
      this.config = payload;
     
      //G Load client secrets from a local file.
      this.CREDENTIALS_PATH = this.path + '/credentials.json';
      fs.readFile(this.CREDENTIALS_PATH, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Tasks API.
        self.authorization = JSON.parse(content);
        self.authorize(self.authorization, self.getTaskLists.bind(self));
      });
      self.config.lists.forEach(function(l){
      self.config.infos[l.id] = {};
      self.fetchHandleAPI(l);
      
      });
      this.started = true;
    }
  },

  fetchHandleAPI: function(_l) {
    var retry = true;
    var self = this;
    if (self.googleAuthReady) {
          self.getTasksFromList(_l);
    } 
    if (retry) {
      
      setTimeout(function() {
        self.fetchHandleAPI(_l);
      }, self.googleAuthReady ? _l.updateInterval : (_l.initialLoadDelay + 10));
    }
  },

});
