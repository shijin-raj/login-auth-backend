// userModel.js
const users = [
  { id: 1, username: 'user1', password: 'xa@111' },
  { id: 2, username: 'user2', password: 'password2' },
];

module.exports = {
  findByUsername: (username) => users.find((user) => user.username === username),
  findById: (id) => users.find((user) => user.id === id),
};
  