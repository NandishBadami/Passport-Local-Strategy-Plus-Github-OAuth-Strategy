const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
require('dotenv').config();

const app = express();

app.use(express.urlencoded({ extended: false }));

app.use(
    session({
        secret: 'a',
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            secure: false
        },
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.session());

passport.use(
    new LocalStrategy((username, password, done) => {
        let User = null;
        users.forEach(user => {
            if(user.username == username) User = user;            
        });
        if(!User) return done(null, false, {message: 'Incorrect Username'});
        if(User.password != password) return done(null, false, {message: 'Incorrect Passord'});
        return done(null, User);
    })
);

passport.use(new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'https://passport-local-strategy-plus-github.onrender.com/auth/github/callback'
},
(accessToken, refreshToken, profile, done) => {
    let user = users.find(user => user.githubId === profile.id);
    if(!user) {
        let id = 1;
        if(users.length > 0) id = users[users.length - 1].id + 1;
        user = {
            id,
            githubId: profile.id,
            username: profile.username,
        };
        users.push(user);
    }
    return done(null, user);
}
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    users.forEach(user => {
        if(user.id == id) done(null, user);
    })
});

const users = [];

app.get('/', (req, res) => {
    console.log(users);
    if(req.isAuthenticated())
    return res.render('index.ejs', {user: req.user});
    res.redirect('/login');
});

app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.post('/register', (req, res) => {
    let usernameTaken = false;
    const {username, password} = req.body;
    users.forEach(user => {
        if(user.username == username) usernameTaken = true;
    });
    if(usernameTaken) return res.render('register.ejs', {error: 'Username already taken'});
    let id = 1;
    if(users.length > 0) id = users[users.length - 1].id + 1;
    const user = {id, username, password};
    users.push(user);
    req.login(user, err => {
        if(err) throw err;
        res.redirect('/');
    });
});

app.get('/login', (req, res) => {
    res.render('login.ejs', {error: req.session.messages});
});

app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureMessage: true}));

app.get('/auth/github', passport.authenticate('github', {scope: ['user:username']}));

app.get('/auth/github/callback', passport.authenticate('github', {failureRedirect: '/login', successRedirect: '/'}));

app.get('/logout', (req, res) => {
    req.logout(e => {
        if(e) throw e;
    });
    res.redirect('/login')
});

app.listen('3000', e => {
    if(e) throw e;
    console.log('http://localhost:3000');
});