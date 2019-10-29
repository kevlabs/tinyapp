const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const { generateRandomString, isLoggedIn, addUser, loginUser, logoutUser } = require('./helpers');
const { urlDatabase, users } = require('./data');

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.redirect('/urls');
});


app.get('/urls/new', (req, res) => {
  res.render('urls_new', { user: isLoggedIn(req), alert: null });
});


//make sure that shortUrl exists
app.all('/u(rls)?/:shortURL([^/]+)(/*)?', (req, res, next) => {
  if (!urlDatabase[req.params.shortURL]) {
    next('Short link does not exist');
    return;
  }
  next();
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: isLoggedIn(req), alert: null };
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect('/urls/' + req.params.shortURL);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, user: isLoggedIn(req), alert: null };
  console.log(isLoggedIn(req));
  
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(req.url + '/' + shortURL);
});

app.get('/register', (req, res) => {
  res.render('user_new', { user: isLoggedIn(req), alert: null });
});

//control
app.post('/register', (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    next('Email and/or password cannot be blank!');
    return;
  }
  next();
});

app.post('/register', (req, res) => {
  addUser(res, req.body.email, req.body.password);
  //might move to login
  res.redirect('/urls');
});

//control
app.post('/login', (req, res, next) => {
  if (!req.body.userid) {
    next('Username cannot be blank!');
    return;
  }
  next();
});

app.post('/login', (req, res) => {
  loginUser(res, req.body.userid);
  //might move to login
  res.redirect('/urls');
});

//control
app.post('/logout', (req, res, next) => {
  if (!req.cookies.user_id) {
    next('You are not logged in!');
    return;
  }
  next();
});

app.post('/logout', (req, res) => {
  logoutUser(res);
  //might move to logout
  res.redirect('/urls');
});

//default error handling
app.use((err, req, res, next) => {
  const templateVars = { urls: urlDatabase, user: isLoggedIn(req), alert: err };
  res.render('urls_index', templateVars);
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
