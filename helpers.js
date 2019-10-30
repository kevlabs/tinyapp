const bcrypt = require('bcrypt');
const { urlDatabase, users } = require('./data');

const generateRandomString = function(length) {

  let output = '';
  for (let i = 0; i < length; i++) {
    let char = Math.floor(Math.random() * 62);
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

//returns user obj or undefined if not found
const getUser = function(id, email) {
  return Object.values(users).find(user => id ? user.id === id : user.email === email);
};

//returns user obj if cookie exists, false otherwise
const isLoggedIn = function(req) {
  return req.session.user_id && getUser(req.session.user_id) || false;
};

//return user obj
const addUser = function(email, password) {

  if (getUser(null, email)) throw Error('This email address is already attached to an account. Try to log in instead.');

  const id = generateRandomString(8);
  users[id] = { id, email, password: bcrypt.hashSync(password, 10) };

  return users[id];
};

//login based on combos of id or email+password
const loginUser = function(req, id, email, password) {
  const user = getUser(id, email);
  
  if (!user || !id && bcrypt.compareSync(user.password, password)) throw Error('Incorrect credentials. Please try again.');
  req.session.user_id = user.id;
};

const logoutUser = function(req) {
  delete req.session.user_id;
};

const getOwnUrls = function(userID) {
  return Object.values(urlDatabase).filter(url => url.userID === userID);
};

const getUrl = function(shortURL) {
  return Object.values(urlDatabase).find(url => url.shortURL === shortURL);
};

const addUrl = function(longURL, userID) {
  const shortURL = generateRandomString(6);
  return urlDatabase[shortURL] = { shortURL, longURL, userID};
};

const deleteUrl = function(shortURL) {
  delete urlDatabase[shortURL];
};



module.exports = { generateRandomString, isLoggedIn, addUser, loginUser, logoutUser, getOwnUrls, getUrl, addUrl, deleteUrl };