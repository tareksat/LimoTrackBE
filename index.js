require('dotenv').config()
const express = require("express");
const path = require('path');
require("express-async-errors");
const config = require("config");
const morgan = require("morgan");
const validateId = require('./middlewares/validateID');
const error = require("./middlewares/errors");

const app = express();
app.use(express.json());
app.use(morgan("tiny"));
app.use(error);
require("./startup/routes")(app);
require("./startup/database")();

const port = process.env.PORT;
app.use(express.static("public/"));
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '/public', 'index.html'));
});

const server = app.listen(port, () => {
  console.log(`running on port ${port}`);
});

module.exports = server;
