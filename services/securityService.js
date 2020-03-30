// JSon Web Tokens, provide OAuth2 tokens for security
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');

/**
 * Generate a secret key, or a random sized hex
 * @param {number} size Size
 */
function generateSecretKey(size = 48) {
  return crypto.randomBytes(size).toString('hex');
}

/**
 * JWT encrypt these 3 information together and a secret key to form a token
 * @param {String} id
 * @param {String} username 
 * @param {String} password 
 * @param {String} secretKey 
 */
function jwtSignIn(id, username) {
  const assetsKey = fs.readFileSync(`${__dirname}/../assets.key`);
  let token = jwt.sign({
    id: id,
    username: username,
  }, assetsKey);
  return token;
}

function decodeJWT(token) {
  try {
    const assetsKey = fs.readFileSync(`${__dirname}/../assets.key`);
    return jwt.verify(token, assetsKey);
  } catch (error) {
    throw error;
  }
}

/**
 * Encrypt a string
 * @param {String} value 
 */
function encrypt(value) {
  return crypto.createHash('md5').update(value).digest('hex');
}

module.exports = {
  encrypt,
  generateSecretKey,
  jwtSignIn,
  decodeJWT
}