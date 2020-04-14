const express = require("express");
const jwt = require("jsonwebtoken");
const router = new express.Router();

const ExpressError = require("../expressError");

const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

const Message = require('../models/message');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id',
  ensureLoggedIn,
  async function (req, res, next) {
    try {
      const id = req.params.id;
      const message = await Message.get(id);

      const toUser = message.to_user.username;
      const fromUser = message.from_user.username;

      if (toUser !== req.user.username && fromUser !== req.user.username) {
        throw new ExpressError('Wrong User, not Authorized', 400);
      }

      return res.json({ message });

    } catch (err) {
      return next(err);
    }
  })

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/',
  ensureLoggedIn,
  async function (req, res, next) {
    try {
      const {to_username, body} = req.body;
      const from_username = req.user.username;
      const message = await Message.create(from_username, to_username, body);

      return res.json({ message });

    } catch (err) {
      return next(err);
    }
  })


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read',
  ensureLoggedIn,
  async function (req, res, next) {
    try {
      const id = req.params.id;
      const currUser = req.user.username;

      const message = await Message.get(id);
      const toUser = message.to_user.username;

      if (currUser !== toUser) {
        throw new ExpressError("Wrong User, You cant read this", 400);        
      }

      const readMessage = await Message.markRead(id);
      return res.json({ message: readMessage });

    } catch (err) {
      return next(err);
    }
  })

  module.exports = router;