const bcrypt = require('bcrypt');
const { urlDatabase, users, clicks } = require('./data');

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

//returns user obj or undefined if not found - non-guest users only
const getUser = function(usersDB, id, email, inclGuest = false) {
  return Object.values(usersDB).find(user => inclGuest && user.guest || !user.guest && (id ? user.id === id : user.email === email));
};

//returns user obj if cookie exists, false otherwise
const isLoggedIn = function(usersDB, req, inclGuest = false) {
  return req.session.user_id && getUser(usersDB, req.session.user_id, null, inclGuest) || false;
};

//return user obj
const addUser = function(usersDB, req, email, password, isGuest = false) {
  if (!isGuest && getUser(usersDB, null, email)) throw Error('This email address is already attached to an account. Try to log in instead.');

  //check if user already exists as a guest and if so use existing Id
  const guestUser = !isGuest && isLoggedIn(usersDB, req, true);
  const { id, publicId } = guestUser ? guestUser : { id: generateRandomString(10), publicId: 'Guest-' + generateRandomString(6) };

  return usersDB[id] = isGuest ? { id, guest: true, publicId } : { id, email, password: bcrypt.hashSync(password, 10), guest: false, publicId };
};

//login based on combos of id or email+password
const loginUser = function(usersDB, req, id, email, password, isGuest = false) {
  const user = getUser(usersDB, id, email, isGuest);

  if (!user || !id && bcrypt.compareSync(user.password, password)) throw Error('Incorrect credentials. Please try again.');
  
  req.session.user_id = user.id;
};

const logoutUser = function(req) {
  delete req.session.user_id;
};

const getOwnUrls = function(userID, appendClicks = false) {
  const urls = Object.values(urlDatabase).filter(url => url.userID === userID);
  return appendClicks ? urls.map(url => ({ ...url, clicks: getClicks(url.shortURL), uniqueClicks: getClicks(url.shortURL, true) })) : urls;
};

const getUrl = function(shortURL, appendClicks = false) {
  const url =  Object.values(urlDatabase).find(url => url.shortURL === shortURL);
  return appendClicks ? { ...url, clicks: getClicks(url.shortURL), uniqueClicks: getClicks(url.shortURL, true) } : url;
};

const addUrl = function(longURL, userID) {
  const shortURL = generateRandomString(6);
  return urlDatabase[shortURL] = { shortURL, longURL, userID};
};

const deleteUrl = function(shortURL) {
  delete urlDatabase[shortURL];
};

const updateUrl = function(shortURL, longURL) {
  getUrl(shortURL).longURL = longURL;
};

// IDENTIFY USERS BASED ON COOKIES

const addClick = function(usersDB, req, shortURL) {

  //create guest account if no cookie detected
  let user = isLoggedIn(usersDB, req, true);

  if (!user) {
    user = addUser(req, null, null, true);
    loginUser(usersDB, req, user.id, null, null, true);
  }

  const date = new Date();

  clicks.push({
    id: generateRandomString(10),
    date,
    dateString: date.toLocaleString('en-US', { timeZone: 'America/Toronto' }),
    shortURL,
    userID: user.id,
    userPublicID: user.publicId
  });
};

const getClicks = function(shortURL, uniqueOnly = false) {
  return clicks.filter((uniqueUsers, click) => click.shortURL === shortURL && (uniqueOnly ? !uniqueUsers.some(user => user === click.userID) && uniqueUsers.push(click.userID) : true), []);
  // const uniqueUsers = [];
  // return clicks.filter(click => click.shortURL === shortURL && (uniqueOnly ? !uniqueUsers.some(user => user === click.userID) && uniqueUsers.push(click.userID) : true));
};


module.exports = { generateRandomString, isLoggedIn, addUser, loginUser, logoutUser, getOwnUrls, getUrl, addUrl, deleteUrl, updateUrl, addClick, getClicks };