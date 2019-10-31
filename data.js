const urlsDB = {
  'b2xVn2': {
    shortURL: 'b2xVn2',
    date: 10000,
    dateString: Date(10000).toLocaleString('en-US', { timeZone: 'America/Toronto' }),
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'userRandomID'
  },
  '9sm5xK': {
    shortURL: '9sm5xK',
    date: 340000,
    dateString: Date(340000).toLocaleString('en-US', { timeZone: 'America/Toronto' }),
    longURL: 'http://www.google.com',
    userID: 'userRandomID'
  }
};

const usersDB = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: '123'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

const clicksDB = [];

module.exports = { urlsDB, usersDB, clicksDB };