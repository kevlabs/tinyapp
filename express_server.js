const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');

const { isLoggedIn, addUser, loginUser, logoutUser, getOwnUrls, getUrl, addUrl, deleteUrl, updateUrl, addClick } = require('./helpers');
const { urlsDB, usersDB, clicksDB } = require('./data');


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Coolstuffgoesonhere'],
  maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
}));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.redirect('/urls');
});


// make sure user is logged in for urls route
app.all('/urls/*', (req, res, next) => {
  if (!isLoggedIn(usersDB, req)) {
    req.url = '/login';
    throw Error('You must be logged in to perform said action!');
  }
  next();
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new', { user: isLoggedIn(usersDB, req), error: null });
});


// make sure that shortUrl exists
app.all('/u(rls)?/:shortURL([^/]+)(/*)?', (req, res, next) => {
  if (!getUrl(urlsDB, clicksDB, req.params.shortURL)) throw Error('Short link does not exist');
  next();
});

// redirect to long URL
app.get('/u/:shortURL', (req, res) => {
  const url = getUrl(urlsDB, clicksDB, req.params.shortURL);
  addClick(usersDB, clicksDB, req, url.shortURL);
  res.redirect(url.longURL);
});

// make sure url is user's
app.all('/urls/:shortURL([^/]+)(/*)?', (req, res, next) => {
  const url = getUrl(urlsDB, clicksDB, req.params.shortURL);
  if (url.userID !== req.session.user_id) throw Error('Unauthorized access');
  next();
});

app.post('/urls/:shortURL/delete', (req, res) => {
  deleteUrl(urlsDB, req.params.shortURL);
  res.redirect('/urls');
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { url: getUrl(urlsDB, clicksDB, req.params.shortURL, true), user: isLoggedIn(usersDB, req), error: null };
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  updateUrl(urlsDB, clicksDB, req.params.shortURL, req.body.longURL);
  res.redirect('/urls/' + req.params.shortURL);
});

app.get('/urls', (req, res) => {
  const user = isLoggedIn(usersDB, req);
  const templateVars = { urls: getOwnUrls(urlsDB, clicksDB, user.id, true), user, error: null };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const user = isLoggedIn(usersDB, req);
  if (!user) res.redirect('/login');

  const url = addUrl(urlsDB, req.body.longURL, user.id);
  res.redirect(req.url + '/' + url.shortURL);
});

// redirect logged in users to main page
app.all('/:credType(register|login)', (req, res, next) => {
  const user = isLoggedIn(usersDB, req);
  if (user) res.redirect('/urls');
  next();
});

app.get('/register', (req, res) => {
  res.render('users_cred', { user: null, newUser: true, error: null });
});

// controls
app.post('/register', (req, res, next) => {
  if (!req.body.email || !req.body.password) throw Error('Email and/or password cannot be blank!');
  const user = addUser(usersDB, req, req.body.email, req.body.password);
  loginUser(usersDB, req, user.id);
  next();
});

app.post('/register', (req, res) => {
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  res.render('users_cred', { user: isLoggedIn(usersDB, req), newUser: false, error: null });
});

// controls
app.post('/login', (req, res, next) => {
  if (!req.body.email && !req.body.password) throw Error('Email and password cannot be blank!');
  loginUser(usersDB, res, null, req.body.email, req.body.password);
  next();
});

app.post('/login', (req, res) => {
  res.redirect('/urls');
});

// controls
app.post('/logout', (req, res, next) => {
  if (!req.session.user_id) throw Error('You are not logged in!');
  next();
});

app.post('/logout', (req, res) => {
  logoutUser(req);
  res.redirect('/urls');
});

// login/register error handling
app.use('/:credType(register|login)', (err, req, res, next) => {
  const templateVars = { urls: [], user: null, newUser: req.params.credType === 'register', error: err };
  res.status(403);
  res.render('users_cred', templateVars);
});

// default error handling
app.use((err, req, res, next) => {
  const user = isLoggedIn(usersDB, req);
  const templateVars = { urls: getOwnUrls(urlsDB, clicksDB, user.id, true), user, error: err };
  res.status(400);
  res.render('urls_index', templateVars);
});

// start listening
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
