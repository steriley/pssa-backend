const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

const isAuthorised = (req, res, next) => {
  const header = req.headers['authorization'];

  if (typeof header !== 'undefined') {
    const bearer = header.split(' ');
    const token = bearer[1];

    req.token = token;
    return isVerified(req, res, next);
  } else {
    // 401 Unauthorised
    return res.status(401).json({ message: '401 Unauthorised' });
  }
};

const isVerified = (req, res, next) => {
  jwt.verify(req.token, jwtSecret, err => {
    if (err) {
      return res.status(401).json({ message: err });
    }

    return next();
  });
};

module.exports = isAuthorised;
