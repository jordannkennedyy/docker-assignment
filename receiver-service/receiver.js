const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" }); 

app.post("/receive", upload.single("file"), function (req, res) {
  if (!req.file) {
    console.error("No file received");
    return res.status(400).send("No file received");
  }

  console.log("File received by receiver service:", req.file);


  res.json({
    message: "File received successfully!",
    filePath: req.file.path,
  });
});

app.listen(4000, function () {
  console.log("Receive Service Running");
  console.log("Listening on port 4000");
});