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

const k8s = require('@kubernetes/client-node');

// Kubernetes service IP retrieval function
async function getServiceExternalIP(serviceName, namespace = 'default') {
  // Create a Kubernetes client
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  // Create a client for core V1 API
  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

  try {
    // Fetch the specific service
    const response = await k8sApi.readNamespacedService(serviceName, namespace);
    
    // Extract external IP from LoadBalancer ingress
    const service = response.body;
    if (service.status && service.status.loadBalancer && service.status.loadBalancer.ingress) {
      // Some cloud providers use 'ip', some use 'hostname'
      const externalIP = service.status.loadBalancer.ingress[0].ip || 
                         service.status.loadBalancer.ingress[0].hostname;
      
      return externalIP;
    }
    
    // Fallback to cluster IP if no external IP is found
    return service.spec.clusterIP;
  } catch (error) {
    console.error('Error retrieving service IP:', error);
    return null;
  }
}


app.set("view engine", "ejs");

app.use(express.static("public"));

app.get('/', async (req, res) => {

  const serviceIP = await getServiceExternalIP('auth-service-lb');
  const URL = `http://${serviceIP}:80/login`;
  console.log(`Redirecting to: ${URL}`);
  return res.redirect(URL); // Redirect to resolved service URL
  });
//res.redirect(`http://auth-service:5000/login`);

app.get("/upload", function (req, res) {
  return res.render("upload");
});

const dbHost = 'database-lb.default'

app.post("/upload", upload.single("file"), async function (req, res) {
  console.log("File received by upload service:", req.file);

  const db = mysql.createConnection({
    host: dbHost,  // Docker service name for MySQL
    user: 'user',
    password: 'password',
    database: 'filedb',
  });

  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path), req.file.originalname); // Use original name

    const response = await axios.post("http://receiver-service-lb.default:80/receive", form, {
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
