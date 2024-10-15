const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

// Configure multer to save with original filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Set the upload directory
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original filename
  }
});

const upload = multer({ storage: storage });

app.get('/stream-video', (req, res) => {
  const filepath = req.query.filepath;

  // Check if the file exists
  const fullFilePath = path.join(__dirname, filepath);
  if (!fs.existsSync(fullFilePath)) {
    return res.status(404).send('File not found');
  }
  
  // Stream the file as a video
  // console.log(fs.stat(fullFilePath))
  const videoStream = fs.createReadStream(fullFilePath);
  res.setHeader('Content-Type', 'video/mp4');
  videoStream.pipe(res);
});

app.post("/receive", upload.single("file"), function (req, res) {
  if (!req.file) {
    console.error("No file received");
    return res.status(400).send("No file received");
  }

  console.log("File received by receiver service:", req.file);

  res.json({
    message: "File received successfully!",
    filePath: `/uploads/${req.file.originalname}`, // Use original filename for filePath
  });
});

app.listen(4000, function () {
  console.log("Receive Service Running");
  console.log("Listening on port 4000");
});