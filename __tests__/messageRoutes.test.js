const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const Message = require("../models/message");

const { SECRET_KEY } = require("../config");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config")


let testUserToken;
let testUserToken2;

describe("Message Routes Test", function () {

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    const hashedPassword = await bcrypt.hash(
      "secret", BCRYPT_WORK_FACTOR);

    await db.query(`
    INSERT INTO users (username, 
                       password,
                       first_name, 
                       last_name, 
                       phone, 
                       join_at, 
                       last_login_at)

    VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
    RETURNING username, password, first_name, last_name, phone`,
      ['test1', hashedPassword, 'max', 'jung', 'testphonenum']);

    await db.query(`
    INSERT INTO users (
                       username, 
                       password,
                       first_name, 
                       last_name, 
                       phone, 
                       join_at, 
                       last_login_at)

    VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
    RETURNING username, password, first_name, last_name, phone`,
      ['test2', hashedPassword, 'eric', 'jho', 'testphonenum']);

    await db.query(`
    INSERT INTO messages (id, 
                          from_username,
                          to_username,
                          body,
                          sent_at,
                          read_at
                          )
    VALUES (1000, $1, $2,'hello', current_timestamp, current_timestamp),
     (2000, $1,$2,'oh snap hello again!', current_timestamp,current_timestamp),
     (3000, $2,$1,'i hate corona', current_timestamp,current_timestamp)`,
      ['test1', 'test2'])

    // later we will test posting message into db. The issue with added messages into database with explicit id of 1, 2, 3 is that when psql adds new msg to db, it wont know that there is already messages with id 1, 2, 3 and will try to make a msg with id of 1. Therefore we have given id of 1000, 2000, and 3000. 

    // we'll need tokens for future requests

    const testUser = { username: 'test1' };
    testUserToken = jwt.sign(testUser, SECRET_KEY);

    const testUser2 = { username: 'test2' };
    testUserToken2 = jwt.sign(testUser2, SECRET_KEY);
  })

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

  describe("GET messages/:id/", function () {
    test("can see message if user is logged in", async function () {
      let response = await request(app)
        .get("/messages/1000")
        .send({ _token: testUserToken });

      expect(response.statusCode).toBe(200);
      expect(response.body.message.body).toEqual('hello');
    });
  });

  /** GET /:id - Don't get detail of message if NOT logged in
  **/

  describe("GET messages/:id/", function () {
    test("can see message if user is logged in", async function () {
      let response = await request(app)
        .get("/messages/1")
        .send({ _token: 'wrong token' });

      expect(response.statusCode).toBe(401);
    });
  });


  /** POST / - post message.
   *
   * {to_username, body} =>
   *   {message: {id, from_username, to_username, body, sent_at}}
   *
   **/

  describe("POST messages/", function () {
    test("can see message if user is logged in", async function () {
      let response = await request(app)
        .post("/messages/")
        .send({ _token: testUserToken, to_username: 'test2', body: 'Have a nice day' });

      expect(response.statusCode).toBe(200);
      expect(response.body.message.body).toEqual('Have a nice day');
      expect(response.body.message.from_username).toEqual('test1');
      expect(response.body.message.to_username).toEqual('test2');
    });
  });

  /** POST / - Don't post message if NOT logged in
   **/

  describe("POST messages/", function () {
    test("can see message if user is logged in", async function () {
      let response = await request(app)
        .post("/messages/")
        .send({ _token: 'wrong', to_username: 'test2', body: 'Have a nice day' });

      expect(response.statusCode).toBe(401);
    });
  });

  /** POST/:id/read - mark message as read:
    *
    *  => {message: {id, read_at}}
    *
    * Make sure that the only the intended recipient can mark as read.
    *
    **/

   describe("POST messages/id/read", function () {
    test("Message marked as read only if recipient user", async function () {
      let response = await request(app)
        .post("/messages/1000/read")
        .send({ _token: testUserToken2});

      expect(response.statusCode).toBe(200);
      expect(response.body.message.id).toEqual(1000);
      expect(response.body.message.read_at.includes('2020')).toEqual(true);
      // Even though in db the date is type of date, once we send it in json, it will convert that date into a string, so we have to convert that string back into date type. 
      // could also convert to date
      // test the whole res.body.message (after converting read_at to date) to confirm overall json shape (doesnt contain what you dont want to return)
    });
  });

  /** POST/:id/read - Don't mark message as read if user is not recipient of message:
   **/

   describe("POST messages/id/read", function () {
    test("Message marked as read only if recipient user", async function () {
      let response = await request(app)
        .post("/messages/1000/read")
        .send({ _token: testUserToken});

      expect(response.statusCode).toBe(401);
    });
  });
})


afterAll(async function () {
  await db.end();
})
