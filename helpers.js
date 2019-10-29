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

const addUser = function(res, email, password) {
  const id = generateRandomString(8);
  users[id] = { id, email, password };

  loginUser(res, email);
};

const loginUser = function(res, username) {
  res.cookie('username', username);
};

const logoutUser = function(res) {
  res.clearCookie('username');
};



module.exports = { generateRandomString, addUser, loginUser, logoutUser };