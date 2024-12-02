const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const mysql = require("mysql2")

const app = express();
const upload = multer({ dest: "uploads/" });

const dns = require('dns');
const authService = 'auth-service';


app.set("view engine", "ejs");

app.use(express.static("public"));

app.get('/', (req, res) => {

  dns.lookup(authService + '.default.svc.cluster.local', (err, address, family) => {
    if (err) {
      return res.status(500).send('Failed to resolve service IP');
    }

    const URL = `http://${address}:5000/video`;
    return res.redirect(URL); // Redirect to resolved service URL
  });

  //res.redirect(`http://auth-service:5000/login`);
});

app.get("/upload", function (req, res) {
  return res.render("upload");
});

app.post("/upload", upload.single("file"), async function (req, res) {
  console.log("File received by upload service:", req.file);

  const db = mysql.createConnection({
    host: 'db',  // Docker service name for MySQL
    user: 'user',
    password: 'password',
    database: 'filedb',
  });

  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path), req.file.originalname); // Use original name

    const response = await axios.post("http://receiver-service:4000/receive", form, {
      headers: {
        ...form.getHeaders(), // Set correct headers for multipart/form-data
      },
    });

    if (response.status === 200) {
      console.log("File successfully sent to receiver and response received:", response.data);

      const query = `INSERT INTO files (filepath, filename) VALUES (?, ?)`;
      db.query(query, [response.data.filePath, req.file.originalname], (err, result) => {
        if (err) {
          console.error('Error inserting into database:', err);
          return res.status(500).send('Error saving to database');
        }
        console.log('File details saved to database:', result);
        
        // Remove the file after successful transfer
        fs.unlinkSync(req.file.path);
        res.send("File uploaded and sent successfully!");
      });
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
