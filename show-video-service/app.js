const express = require('express');
const mysql = require('mysql2');
const AWS = require('aws-sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const authService = 'auth-service-lb'
const receiverService = 'receiver-service-lb'
const dns = require('dns');

app.set('view engine', 'pug');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// create MySQL connection
const pool = mysql.createPool({
    host: 'db',    
    user: 'user',         
    password: 'password', 
    database: 'filedb'
  });

app.get('/', (req, res) => {

  dns.lookup('auth-service-lb.default.svc.cluster.local', (err, address, family) => {
    if (err) {
      return res.status(500).send('Failed to resolve service IP');
    }

    const URL = `http://${address}:5000/login`;
    return res.redirect(URL); // Redirect to resolved service URL
  });

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


  app.post('/get-video', (req, res) => {
    const selectedFilePath = req.body.selectedOption; // Filepath from the form

    dns.lookup('receiver-service-lb.default.svc.cluster.local', (err, address, family) => {
      if (err) {
        return res.status(500).send('Failed to resolve service IP');
      }
      // Construct the URL for the video file on the receiver service
      const videoUrl = `http://${address}:4000/stream-video?filepath=${encodeURIComponent(selectedFilePath)}`;
      // Redirect the client to the video URL
      res.redirect(videoUrl);
    });
  });



const port = 2000;
app.listen(port, () => {
    console.log('Server running on http://show-video-service:2000');
});
