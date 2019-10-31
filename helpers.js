const bcrypt = require('bcrypt');

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

const getOwnUrls = function(urlsDB, clicksDB, userID, appendClicks = false) {
  const urls = Object.values(urlsDB).filter(url => url.userID === userID);
  return appendClicks ? urls.map(url => ({ ...url, clicks: getClicks(clicksDB, url.shortURL), uniqueClicks: getClicks(clicksDB, url.shortURL, true) })) : urls;
};

const getUrl = function(urlsDB, clicksDB, shortURL, appendClicks = false) {
  const url =  Object.values(urlsDB).find(url => url.shortURL === shortURL);
  return appendClicks ? { ...url, clicks: getClicks(clicksDB, url.shortURL), uniqueClicks: getClicks(clicksDB, url.shortURL, true) } : url;
};

const addUrl = function(urlsDB, longURL, userID) {
  const shortURL = generateRandomString(6);
  const date = new Date();

  return urlsDB[shortURL] = {
    shortURL,
    date,
    dateString: `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`,
    longURL,
    userID
  };
};

const deleteUrl = function(urlsDB, shortURL) {
  delete urlsDB[shortURL];
};

const updateUrl = function(urlsDB, clicksDB, shortURL, longURL) {
  getUrl(urlsDB, clicksDB, shortURL).longURL = longURL;
};

// IDENTIFY USERS BASED ON COOKIES

const addClick = function(usersDB, clicksDB, req, shortURL) {

  //create guest account if no cookie detected
  let user = isLoggedIn(usersDB, req, true);

  if (!user) {
    user = addUser(usersDB, req, null, null, true);
    loginUser(usersDB, req, user.id, null, null, true);
  }

  const date = new Date();

  clicksDB.push({
    id: generateRandomString(10),
    date,
    dateString: date.toLocaleString('en-US', { timeZone: 'America/Toronto' }),
    shortURL,
    userID: user.id,
    userPublicID: user.publicId
  });
};

const getClicks = function(clicksDB, shortURL, uniqueOnly = false) {
  const uniqueUsers = [];
  return clicksDB.filter(click => click.shortURL === shortURL && (uniqueOnly ? !uniqueUsers.some(user => user === click.userID) && uniqueUsers.push(click.userID) : true));
};


module.exports = { generateRandomString, getUser, isLoggedIn, addUser, loginUser, logoutUser, getOwnUrls, getUrl, addUrl, deleteUrl, updateUrl, addClick, getClicks };