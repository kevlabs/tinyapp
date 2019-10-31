const { getUser, isLoggedIn, addUser, loginUser, logoutUser, getOwnUrls, getUrl, addUrl, deleteUrl, updateUrl, addClick } = require('../helpers');

const { assert } = require('chai');

const testUsers = {
  'userRandomID': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

describe('getUser', function() {
  it('should return a user object with a valid email', function() {
    const user = getUser(testUsers, null, 'user@example.com');
    assert.deepEqual(user, testUsers['userRandomID']);
  });
  it('should return undefined with an invalid email', function() {
    const user = getUser(testUsers, null, 'user@example.ca');
    assert.equal(user, undefined);
  });
  it('should return a user object with a valid id', function() {
    const user = getUser(testUsers, 'user2RandomID');
    assert.deepEqual(user, testUsers['user2RandomID']);
  });
  it('should return undefined with an invalid id', function() {
    const user = getUser(testUsers, 'user2RandmID');
    assert.equal(user, undefined);
  });
  it('should return undefined with no id/email args', function() {
    const user = getUser(testUsers);
    assert.equal(user, undefined);
  });
});