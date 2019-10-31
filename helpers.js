const bcrypt = require('bcrypt');

/**
 * Generates random alpha-numeric string
 * @param {number} length length of the returned string
 * @return {string}
 */
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


/**
 * Gets user info
 * @param {usersDB} usersDB user data
 * @param {string} [id] user id
 * @param {string} [email] user email
 * @param {boolean} [inclGuest=false] include guest users
 * @return {user|undefined} user object if exists or undefined otherwise
 */
const getUser = function(usersDB, id, email, inclGuest = false) {
  return Object.values(usersDB).find(user => inclGuest && user.guest || !user.guest && (id ? user.id === id : user.email === email));
};


/**
 * Is guest logged in?
 * @param {usersDB} usersDB user data
 * @param {request} req http request object
 * @param {boolean} [inclGuest=false] include guest users
 * @return {user|false} user object if cookie exists, false otherwise
 */
const isLoggedIn = function(usersDB, req, inclGuest = false) {
  return req.session.user_id && getUser(usersDB, req.session.user_id, null, inclGuest) || false;
};


/**
 * Adds user to users DB object
 * Reassign guest user ID if a valid guest user cookie exists
 * @param {usersDB} usersDB user data
 * @param {request} req http request object
 * @param {string} [email] required for non-guest users
 * @param {string} [password] required for non-guest users
 * @param {boolean} [isGuest=false] user is a guest
 * @return {user|false} user object
 */
const addUser = function(usersDB, req, email, password, isGuest = false) {
  if (!isGuest && getUser(usersDB, null, email)) throw Error('This email address is already attached to an account. Try to log in instead.');

  //check if user already exists as a guest and if so use existing Id
  const guestUser = !isGuest && isLoggedIn(usersDB, req, true);
  const { id, publicId } = guestUser ? guestUser : { id: generateRandomString(10), publicId: 'Guest-' + generateRandomString(6) };

  return usersDB[id] = isGuest ? { id, guest: true, publicId } : { id, email, password: bcrypt.hashSync(password, 10), guest: false, publicId };
};


/**
 * Sets user session cookie
 * User is identified via either of id or email+password
 * @param {usersDB} usersDB user data
 * @param {request} req http request object
 * @param {string} [id] required if no email or password passed
 * @param {string} [email] required if no id passed
 * @param {string} [password] required if no id passed
 * @return {void}
 */
const loginUser = function(usersDB, req, id, email, password) {
  const user = getUser(usersDB, id, email, true);

  if (!user || !id && bcrypt.compareSync(user.password, password)) throw Error('Incorrect credentials. Please try again.');
  
  req.session.user_id = user.id;
};

/**
 * Deletes user session cookie
 * @param {request} req http request object
 * @return {void}
 */
const logoutUser = function(req) {
  delete req.session.user_id;
};

/**
 * Gets all URLs belonging to passed user
 * @param {urlsDB} urlsDB urls data
 * @param {clicksDB} cliskDB clicks data
 * @param {string} userID user id
 * @param {boolean} [appendClicks=false] adds clicks data to each returned url object
 * @return {<url>} collection of url objects
 */
const getOwnUrls = function(urlsDB, clicksDB, userID, appendClicks = false) {
  const urls = Object.values(urlsDB).filter(url => url.userID === userID);
  return appendClicks ? urls.map(url => ({ ...url, clicks: getClicks(clicksDB, url.shortURL), uniqueClicks: getClicks(clicksDB, url.shortURL, true) })) : urls;
};

/**
 * Fetches URL object based on shortURL
 * @param {usersDB} usersDB user data
 * @param {clicksDB} cliskDB clicks data
 * @param {string} shortURL shortURL handle
 * @param {boolean} [appendClicks=false] adds clicks data to returned url object
 * @return {url|undefined} url object if exists or undefined otherwise
 */
const getUrl = function(urlsDB, clicksDB, shortURL, appendClicks = false) {
  const url =  Object.values(urlsDB).find(url => url.shortURL === shortURL);
  return appendClicks ? { ...url, clicks: getClicks(clicksDB, url.shortURL), uniqueClicks: getClicks(clicksDB, url.shortURL, true) } : url;
};


/**
 * Adds URL to the passed URLs data object
 * @param {urlsDB} urlsDB urls data
 * @param {string} longURL url the shortURL should link to
 * @param {string} userID valid user id
 * @return {url} url object
 */
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


/**
 * Deletes url objct from the passed URLs data object if it exists
 * @param {urlsDB} urlsDB urls data
 * @param {string} shortURL shortURL handle
 * @return {void}
 */
const deleteUrl = function(urlsDB, shortURL) {
  delete urlsDB[shortURL];
};


/**
 * Updates url object's long url based on id
 * @param {urlsDB} urlsDB urls data
 * @param {clicksDB} cliskDB clicks data
 * @param {string} shortURL shortURL handle
 * @param {string} longURL new long url tolink to
 * @return {void}
 */
const updateUrl = function(urlsDB, clicksDB, shortURL, longURL) {
  getUrl(urlsDB, clicksDB, shortURL).longURL = longURL;
};

// IDENTIFY USERS BASED ON COOKIES

/**
 * Adds click to the passed clicks data object
 * @param {usersDB} usersDB user data
 * @param {clicksDB} cliskDB clicks data
 * @param {request} req http request
 * @param {string} shortURL shortURL url identifier
 * @return {void}
 */
const addClick = function(usersDB, clicksDB, req, shortURL) {

  let user = isLoggedIn(usersDB, req, true);
  
  //create guest account if no cookie detected
  if (!user) {
    user = addUser(usersDB, req, null, null, true);
    loginUser(usersDB, req, user.id);
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


/**
 * Gets clicks from to the passed clicks data object based on shortURL
 * @param {clicksDB} cliskDB clicks data
 * @param {string} shortURL shortURL identifier
 * @param {boolean} [uniqueOnly=false] whether thereturned object should include unique clicks only
 * @return {<click>} collection of click objects
 */
const getClicks = function(clicksDB, shortURL, uniqueOnly = false) {
  const uniqueUsers = [];
  return clicksDB.filter(click => click.shortURL === shortURL && (uniqueOnly ? !uniqueUsers.some(user => user === click.userID) && uniqueUsers.push(click.userID) : true));
};


module.exports = { generateRandomString, getUser, isLoggedIn, addUser, loginUser, logoutUser, getOwnUrls, getUrl, addUrl, deleteUrl, updateUrl, addClick, getClicks };