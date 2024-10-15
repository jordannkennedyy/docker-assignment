const express = require('express');
const mysql = require('mysql2');
const AWS = require('aws-sdk');
const app = express();

app.set('view engine', 'pug');


// create MySQL connection
const pool = mysql.createPool({
    host: 'db',    
    user: 'user',         
    password: 'password', 
    database: 'filedb'
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

  

const port = 2000;
app.listen(port, () => {
    console.log('Server running on http://localhost:3000');
});
