const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { jwtSecret, appUser, appPass } = require('../config');

// https://medium.com/@maison.moa/using-jwt-json-web-tokens-to-authorize-users-and-protect-api-routes-3e04a1453c3e

const user = {
  username: appUser,
  password: appPass,
};

router.get('/', (_, res) => res.json({ hello: `user` }));

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const expiresIn = 24 * 60 * 60; // 1 day;

  if (username === user.username && password === user.password) {
    jwt.sign({ user }, jwtSecret, { expiresIn }, (err, token) => {
      if (err) {
        return res.statusCode(500).json({ message: err });
      }

      return res.json({ token, expires: +new Date() + expiresIn * 1000 });
    });
  } else {
    return res.status(403).json({ message: 'Not Authorised' });
  }
});

module.exports = router;
