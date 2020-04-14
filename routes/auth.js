const express = require("express");
const jwt = require("jsonwebtoken");
const router = new express.Router();

const User = require('../models/user');

const ExpressError = require("../expressError");

const { SECRET_KEY } = require("../config");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async function (req, res, next) {
  try {
    const { username, password } = req.body;
    // const result = await db.query(
    //   `SELECT password FROM users 
    //     WHERE username = $1
    //   `,
    //   [username]
    // )

    const result = await User.authenticate(username, password);

    if (result) {
      let token = jwt.sign({ username }, SECRET_KEY);

      // Update last login time
      await User.updateLoginTimestamp(username);
      return res.json({ token });
    } else {
      throw new ExpressError('Invalid user/password', 400);
    }

  } catch (err) {
    return next(err);
  }
})


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async function (req, res, next) {
  try {
    // const { username, password, first_name, last_name, phone } = req.body;
    const {username} = await User.register(req.body);
  
    // await User.updateLoginTimestamp(username);
    let token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });

  } catch (err) {
    return next(err);
  }
})



module.exports = router;