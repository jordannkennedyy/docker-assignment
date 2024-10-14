const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const upload = multer({ dest: "uploads/" });

app.set("view engine", "ejs");

app.use(express.static("public"));

app.get("/", function (req, res) {
  return res.render("upload");
});

app.post("/upload", upload.single("file"), async function (req, res) {
  console.log("File received by upload service:", req.file);

  try {

    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path), req.file.originalname);

    const response = await axios.post("http://receiver-container:4000/receive", form, {
      headers: {
        ...form.getHeaders(), // Set correct headers for multipart/form-data
      },
    });

    if (response.status === 200) {
      console.log("File successfully sent to receiver and response received:", response.data);
      // Remove the file after successful transfer
      fs.unlinkSync(req.file.path);
      res.send("File uploaded and sent successfully!");
    } else {
      res.send("Error sending file");
    }
  } catch (error) {
    console.error("Error during file transfer:", error);
    res.status(500).send("Error occurred during file upload or transfer");
  }
});

app.listen(3000, function () {
  console.log("Upload Service Running");
  console.log("Listening on port 3000");
});
