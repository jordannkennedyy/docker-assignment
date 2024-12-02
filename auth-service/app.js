const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

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
app.post('/login/2000', async (req, res) => {
  const { username, password } = req.body;

  if (username === user.username && password === user.password) {
    req.session.loggedIn = true;
    req.session.username = username;

    const serviceIP = await getServiceExternalIP('show-video-service-lb');
    const URL = `http://${serviceIP}:80/video`;
    console.log(`Redirecting to: ${URL}`);
    return res.redirect(URL); // Redirect to resolved service URL

  } else {
    return res.send('Invalid username or password for port 2000. <a href="/login">Try again</a>');
  }
});


// Handle login to localhost:3000
app.post('/login/3000', async (req, res) => {
  const { username, password } = req.body;
  if (username === user.username && password === user.password) {
    req.session.loggedIn = true;
    req.session.username = username;

    const serviceIP = await getServiceExternalIP('upload-service-lb');
    const URL = `http://${serviceIP}:80/upload`;
    console.log(`Redirecting to: ${URL}`);
    return res.redirect(URL); // Redirect to resolved service URL

  } else { 
    return res.send('Invalid username or password for port 3000. <a href="/login">Try again</a>');
  }
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
  console.log(`Server is running on http://auth-service:${PORT}`);
});


