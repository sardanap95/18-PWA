const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const compression = require("compression");
const cors = require("cors");
const PORT = 3000;

const app = express();

app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: ["http://127.0.0.1:5500", "http://127.0.0.1:5501"] }));

app.use(express.static("public"));

mongoose
  .connect("mongodb://localhost/budget", {
    useNewUrlParser: true,
    useFindAndModify: false,
  })
  .then(function () {
    console.log("Connected to DB successfully.");
  })
  .catch(function (err) {
    console.log("Connection failed");
  });

// routes
app.use(require("./routes/api.js"));

app.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
});
