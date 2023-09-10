require('dotenv').config();

module.exports = {
  appPass: process.env.APP_PASS,
  appUser: process.env.APP_USER,
  dbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
};
