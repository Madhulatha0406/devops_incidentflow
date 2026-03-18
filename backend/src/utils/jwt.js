const jwt = require("jsonwebtoken");

const signToken = (payload, secret, expiresIn) =>
  jwt.sign(payload, secret, {
    expiresIn
  });

const verifyToken = (token, secret) => jwt.verify(token, secret);

module.exports = {
  signToken,
  verifyToken
};
