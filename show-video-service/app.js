const express = require('express');
const mysql = require('mysql2');
const AWS = require('aws-sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();

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
      const externalIP = service.status.loadBalancer.ingress[0]
      const IP = externalIP.ip
      
      return IP;
    }
    
    // Fallback to cluster IP if no external IP is found
    return service.spec.clusterIP;
  } catch (error) {
    console.error('Error retrieving service IP:', error);
    return null;
  }
}

app.set('view engine', 'pug');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const dbHost = 'database-lb.default'

// create MySQL connection
const pool = mysql.createPool({
    host: dbHost,    
    user: 'user',         
    password: 'password', 
    database: 'filedb'
  });

app.get('/', async (req, res) => {

  const serviceIP = await getServiceExternalIP('auth-service-lb');
  const URL = `http://${serviceIP}:80/login`;
  console.log(`Redirecting to: ${URL}`);
  return res.redirect(URL); // Redirect to resolved service URL

  //res.redirect(`http://auth-service:5000/login`);
});

// Display Videos in a List
app.get('/video', (req, res) => {
    const sqlQuery = 'SELECT * FROM files'; // query to get the items from the database
  
    // Query the database
    pool.query(sqlQuery, (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

  
      // Convert database results into an array of item names (or other fields you need)
      const items = results.map(item => ({
        filename: item.filename,
        filepath: item.filepath
      }));
  
      const data = {
        title: 'Videos',
        message: 'Available Videos to Watch:',
        items: items
      };
      
      res.render('index', data); // Render the view and pass the data
    });
  });







  // app.post('/get-video', async (req, res) => {
  //   const selectedFilePath = req.body.selectedOption; // Filepath from the form
  //   console.log(req.body.selectedOption)
  //   try {
  //     // Request the video from the receiver service
  //     const response = await axios({
  //       method: 'get',
  //       url: `http://receiver-container:4000/stream-video`,
  //       params: {
  //         filepath: selectedFilePath
  //       },
  //       responseType: 'stream'
  //     });
  
  //     // Set headers for video streaming
  //     res.setHeader('Content-Type', 'video/mp4');
  
  //     // Pipe the video stream from the receiver service to the client
  //     response.data.pipe(res);
      
  //   } catch (error) {
  //     console.error('Error fetching video:', error);
  //     res.status(500).send('Error retrieving video file');
  //   }
  // });


  app.post('/get-video', async (req, res) => {
    const selectedFilePath = req.body.selectedOption; // Filepath from the form

    const serviceIP = await getServiceExternalIP('receiver-service-lb');
    console.log(`Redirecting to: ${URL}`);

      // Construct the URL for the video file on the receiver service
      const videoUrl = `http://${serviceIP}:80/stream-video?filepath=${encodeURIComponent(selectedFilePath)}`;
      // Redirect the client to the video URL
      res.redirect(videoUrl);
  });



const port = 2000;
app.listen(port, () => {
    console.log('Server running on http://show-video-service:2000');
});
