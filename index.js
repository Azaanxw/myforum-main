// Import the modules we need
var express = require("express");
var ejs = require("ejs");
var session = require("express-session");
var bodyParser = require("body-parser");
const mysql = require("mysql");
var crypto = require("crypto");
var flash = require("connect-flash");

// Create the express application object
const app = express();
const port = 8000;
app.use(bodyParser.urlencoded({ extended: true }));

// Creates the classified session
var secretSessionKey = crypto.randomBytes(40).toString("hex");

// Configuration for the session for login
app.use(
  session({
    secret: secretSessionKey,
    resave: true,
    saveUninitialized: true,
  })
);

// Flush for messages/errors
app.use(flash());

// Set up the css and the images to be used
app.use(express.static(__dirname + "/public"));

// Define the database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "appuser",
  password: "app2027",
  database: "forumapp",
});

// Connect to the database
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to database");
});
global.db = db;

// Serve static files from the "public" directory
app.use(express.static(__dirname + "/public"));

// Set the directory where Express will pick up HTML files
// __dirname will get the current directory
app.set("views", __dirname + "/views");

// Tell Express that we want to use EJS as the templating engine
app.set("view engine", "ejs");

// Tells Express how we should process html files
// We want to use EJS's rendering engine
app.engine("html", ejs.renderFile);

// Requires the main.js file inside the routes folder passing in the Express app and data as arguments.  All the routes will go in this file
require("./routes/main")(app);

// Start the web app listening
app.listen(port, () => console.log(`TopicHub app listening on port ${port}!`));

