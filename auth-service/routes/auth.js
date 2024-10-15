const express = require('express');
const passport = require('passport');
const router = express.Router();

// Home route
router.get('/', (req, res) => {
    res.send('Welcome to Video Service');
});

// Login route
router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', passport.authenticate('local', {
    successRedirect: 'https://google.ca',
    failureRedirect: '/login'
}));

// Profile route (protected)
router.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { user: req.user });
});

// Logout route
router.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

// Middleware to protect routes
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

module.exports = router;