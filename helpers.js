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
const getUser = function(id, email, inclGuest = false) {
  return Object.values(users).find(user => inclGuest && user.guest || !user.guest && (id ? user.id === id : user.email === email));
};

//returns user obj if cookie exists, false otherwise
const isLoggedIn = function(req, inclGuest = false) {
  return req.session.user_id && getUser(req.session.user_id, null, inclGuest) || false;
};

//return user obj
const addUser = function(req, email, password, isGuest = false) {
  if (!isGuest && getUser(null, email)) throw Error('This email address is already attached to an account. Try to log in instead.');

  //check if user already exists as a guest and if so use existing Id
  const guestUser = !isGuest && isLoggedIn(req, true);
  const { id, publicId } = guestUser ? guestUser : { id: generateRandomString(10), publicId: 'Guest-' + generateRandomString(6) };

  return users[id] = isGuest ? { id, guest: true, publicId } : { id, email, password: bcrypt.hashSync(password, 10), guest: false, publicId };
};

//login based on combos of id or email+password
const loginUser = function(req, id, email, password, isGuest = false) {
  const user = getUser(id, email, isGuest);

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

const getUrl = function(shortURL, appendClick = false) {
  const url =  Object.values(urlDatabase).find(url => url.shortURL === shortURL);
  return appendClick ? { ...url, clicks: getClicks(url.shortURL), uniqueClicks: getClicks(url.shortURL, true) } : url;
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


// IDENTIFY USERS BASED ON IP ADDRESSES
// const addClick = function(req, shortURL) {

//   //find if click exists for same IP so that we can use the same hash
//   const prevClick = getClicks(shortURL, true).find(click => bcrypt.compareSync(req.connection.remoteAddress, click.hashedID));
  
//   clicks.push({
//     date: Date.now(),
//     shortURL,
//     hashedID: prevClick ? prevClick.hashedID : bcrypt.hashSync(req.connection.remoteAddress, 10)
//   });
  
// };

// const getClicks = function(shortURL, uniqueOnly = false) {
//   const uniqueHashed = [];
//   return clicks.filter(click => click.shortURL === shortURL && (uniqueOnly ? !uniqueHashed.some(hashed => hashed === click.hashedID) && uniqueHashed.push(click.hashedID) : true));
// };

// IDENTIFY USERS BASED ON COOKIES

const addClick = function(req, shortURL) {

  //create guest account if no cookie detected
  let user = isLoggedIn(req, true);

  if (!user) {
    user = addUser(req, null, null, true);
    loginUser(req, user.id, null, null, true);
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
  const uniqueUsers = [];
  return clicks.filter(click => click.shortURL === shortURL && (uniqueOnly ? !uniqueUsers.some(user => user === click.userID) && uniqueUsers.push(click.userID) : true));
};


module.exports = { generateRandomString, isLoggedIn, addUser, loginUser, logoutUser, getOwnUrls, getUrl, addUrl, deleteUrl, updateUrl, addClick, getClicks };