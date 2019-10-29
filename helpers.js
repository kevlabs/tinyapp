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

const addUser = function(res, email, password) {
  const id = generateRandomString(8);
  users[id] = { id, email, password };

  loginUser(res, id);
};

const loginUser = function(res, id) {
  res.cookie('user_id', id);
};

const logoutUser = function(res) {
  res.clearCookie('user_id');
};



module.exports = { generateRandomString, isLoggedIn, addUser, loginUser, logoutUser };