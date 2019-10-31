const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['Coolstuffgoesonhere'],
  maxAge: 365 * 24 * 60 * 60 * 1000 // 1 year
}));

const { isLoggedIn, addUser, loginUser, logoutUser, getOwnUrls, getUrl, addUrl, deleteUrl, updateUrl, addClick } = require('./helpers');

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.redirect('/urls');
});


//make sure user is logged in for urls route
app.all('/urls/*', (req, res, next) => {
  if (!isLoggedIn(req)) res.redirect('/login');
  next();
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new', { user: isLoggedIn(req), error: null });
});


//make sure that shortUrl exists
app.all('/u(rls)?/:shortURL([^/]+)(/*)?', (req, res, next) => {
  if (!getUrl(req.params.shortURL)) throw Error('Short link does not exist');
  next();
});

app.get('/u/:shortURL', (req, res) => {
  const url = getUrl(req.params.shortURL);
  addClick(req, url.shortURL);
  res.redirect(url.longURL);
});

//make sure url is user's
app.all('/urls/:shortURL([^/]+)(/*)?', (req, res, next) => {
  const url = getUrl(req.params.shortURL);
  if (url.userID !== req.session.user_id) throw Error('Unauthorized access');
  next();
});

app.post('/urls/:shortURL/delete', (req, res) => {
  deleteUrl(req.params.shortURL);
  res.redirect('/urls');
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { url: getUrl(req.params.shortURL, true), user: isLoggedIn(req), error: null };
  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  updateUrl(req.params.shortURL, req.body.longURL);
  res.redirect('/urls/' + req.params.shortURL);
});

app.get('/urls', (req, res) => {
  const user = isLoggedIn(req);
  const templateVars = { urls: getOwnUrls(user.id, true), user, error: null };
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const user = isLoggedIn(req);
  if (!user) res.redirect('/login');

  const url = addUrl(req.body.longURL, user.id);
  res.redirect(req.url + '/' + url.shortURL);
});

app.get('/register', (req, res) => {
  res.render('users_cred', { user: isLoggedIn(req), newUser: true, error: null });
});

//controls
app.post('/register', (req, res, next) => {
  if (!req.body.email || !req.body.password) throw Error('Email and/or password cannot be blank!');
  const user = addUser(req, req.body.email, req.body.password);
  loginUser(req, user.id);
  next();
});

app.post('/register', (req, res) => {
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  res.render('users_cred', { user: isLoggedIn(req), newUser: false, error: null });
});

//controls
app.post('/login', (req, res, next) => {
  if (!req.body.email && !req.body.password) throw Error('Email and password cannot be blank!');
  loginUser(res, null, req.body.email, req.body.password);
  next();
});

app.post('/login', (req, res) => {
  res.redirect('/urls');
});

//controls
app.post('/logout', (req, res, next) => {
  if (!req.session.user_id) throw Error('You are not logged in!');
  next();
});

app.post('/logout', (req, res) => {
  logoutUser(req);
  res.redirect('/urls');
});

//login/register error handling
app.use('/:credType(register|login)', (err, req, res, next) => {
  const templateVars = { urls: [], user: null, newUser: req.params.credType === 'register', error: err };
  res.status(403);
  res.render('users_cred', templateVars);
});

//default error handling
app.use((err, req, res, next) => {
  const user = isLoggedIn(req);
  const templateVars = { urls: getOwnUrls(user.id, true), user, error: err };
  res.status(400);
  res.render('urls_index', templateVars);
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});
