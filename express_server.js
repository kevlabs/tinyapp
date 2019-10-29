const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = function(length) {

  let output = '';
  for (let i = 0; i < length; i++) {
    let char = Math.round(Math.random() * 62);
    if (char < 10) {
      char += 48;
    } else if (char < 36) {
      char += 55;
    } else {
      char += 61;
    }
    output += String.fromCharCode(char);
  }
  return output;
};

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.redirect('/urls');
});



app.get('/urls/new', (req, res) => {
  res.render('urls_new', { username: req.cookies.username ? req.cookies.username : null });
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (urlDatabase[req.params.shortURL]) delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

app.get('/urls/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) res.render('urls_show', { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies.username ? req.cookies.username : null });
});

app.post('/urls/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    urlDatabase[req.params.shortURL] = req.body.longURL;
    res.redirect('/urls/' + req.params.shortURL);
  } else {
    res.redirect('/urls');
  }

});

app.get('/urls', (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies.username ? req.cookies.username : null };
  console.log(req.cookies.username);
  
  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  //redirect user
  res.redirect(302, req.url + '/' + shortURL);
});

app.post('/login', (req, res) => {
  if (req.body.username) res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  if (req.cookies.username) res.clearCookie('username');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});