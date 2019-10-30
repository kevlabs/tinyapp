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


//returns user obj if cookie exists, false otherwise
const isLoggedIn = function(req) {
  return req.cookies.user_id && users[req.cookies.user_id] || false;
};

const isEmailUnique = function(email) {
  return Object.values(users).every(user => user.email !== email);
};

//return user obj
const addUser = function(res, email, password) {

  if (!isEmailUnique(email)) throw Error('This email address is already attached to an account. Try to log in instead.');

  const id = generateRandomString(8);
  users[id] = { id, email, password };

  return users[id];
};

//returns user obj or undefined if not found
const getUser = function(id, email, password) {
  return Object.values(users).find(user => id ? user.id === id : user.email === email && user.password === password);
};

const loginUser = function(res, id, email, password) {
  const user = getUser(id, email, password);
  if (!user) throw Error('Incorrect credentials. Please try again.');
  res.cookie('user_id', user.id);
};

const logoutUser = function(res) {
  res.clearCookie('user_id');
};



module.exports = { generateRandomString, isLoggedIn, addUser, loginUser, logoutUser };