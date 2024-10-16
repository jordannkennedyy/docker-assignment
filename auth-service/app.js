const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Sample user (for demonstration purposes)
const user = {
  username: 'testuser',
  password: 'password123', // Unhashed password for testing
};

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret', // Replace with a strong secret
  resave: false,
  saveUninitialized: true,
}));

// Routes
app.get('/', (req, res) => {
  if (req.session.loggedIn) {
    res.render('welcome', { username: req.session.username });
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

// Handle login to localhost:2000
app.post('/login/2000', (req, res) => {
  const { username, password } = req.body;
  if (username === user.username && password === user.password) {
    req.session.loggedIn = true;
    req.session.username = username;
    return res.redirect('http://localhost:2000/video'); // Redirect to localhost:2000
  }
  res.send('Invalid username or password for port 2000. <a href="/login">Try again</a>');
});

// Handle login to localhost:3000
app.post('/login/3000', (req, res) => {
  const { username, password } = req.body;
  if (username === user.username && password === user.password) {
    req.session.loggedIn = true;
    req.session.username = username;
    return res.redirect('http://localhost:3000/video'); // Redirect to localhost:3000
  }
  res.send('Invalid username or password for port 3000. <a href="/login">Try again</a>');
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error logging out. Please try again.');
    }
    res.redirect('/login');
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


