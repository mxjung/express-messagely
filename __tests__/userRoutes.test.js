const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");

const { SECRET_KEY } = require("../config");
const bcrypt = require("bcrypt");
const {BCRYPT_WORK_FACTOR} = require("../config")


let testUserToken;
let testUserToken2;

describe("User Routes Test", function () {

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    const hashedPassword = await bcrypt.hash(
      "secret", BCRYPT_WORK_FACTOR);

    await db.query( `
    INSERT INTO users (username, 
                       password,
                       first_name, 
                       last_name, 
                       phone, 
                       join_at, 
                       last_login_at)

    VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
    RETURNING username, password, first_name, last_name, phone`,
    ['test1', hashedPassword,'max', 'jung', 'testphonenum']);

    await db.query( `
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
    ['test2', hashedPassword,'eric', 'jho', 'testphonenum']);

    await db.query( `
    INSERT INTO messages (
                          from_username,
                          to_username,
                          body,
                          sent_at,
                          read_at
                          )
    VALUES ($1, $2,'hello', current_timestamp, current_timestamp),
     ($1,$2,'oh snap hello again!', current_timestamp,current_timestamp),
     ($2,$1,'i hate corona', current_timestamp,current_timestamp)`,
     ['test1', 'test2'])

    // we'll need tokens for future requests

    const testUser = { username: 'test1' };
    testUserToken = jwt.sign(testUser, SECRET_KEY);

    const testUser2 = { username: 'test2' };
    testUserToken2 = jwt.sign(testUser2, SECRET_KEY);
  });

  /** GET / - get list of users. 
   *  => {users: [{username, first_name, last_name, phone}, ...]}  */

  describe("GET /users/", function () {
    test("can see the list of users once logged in", async function () {
      let response = await request(app)
        .get("/users/")
        .send({ _token: testUserToken });

      expect(response.statusCode).toBe(200);
      expect(response.body.users.length).toEqual(2);
      });
  });

  /** GET / - Can not get list of users if you are not logged in
   *  => {users: [{username, first_name, last_name, phone}, ...]}  */

  describe("GET /users/", function () {
    test("can NOT see the list of users when NOT logged in", async function () {
      let response = await request(app)
        .get("/users/")
        .send({ _token: "you are not logged in"});

      expect(response.statusCode).toBe(401);
      });
  });

  /** GET /:username - get detail of users.
   *
   * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
   *
   **/

  describe("GET /users/:username", function () {
    test("get details of users and ensures correct user", async function () {
      let response = await request(app)
        .get("/users/test1")
        .send({ _token: testUserToken});

      expect(response.statusCode).toBe(200);
      expect(response.body.user.first_name).toEqual('max');
      });
  });
  
  /** GET /:username - CANT get detail of users if you are a different user.
   */

  describe("GET /users/:username", function () {
    test("unathorized if you are not correct user", async function () {
      let response = await request(app)
        .get("/users/test2")
        .send({ _token: testUserToken});

      expect(response.statusCode).toBe(401);
      });
  });

  /** GET /:username/to - get messages to user
   *
   * => {messages: [{id,
   *                 body,
   *                 sent_at,
   *                 read_at,
   *                 from_user: {username, first_name, last_name, phone}}, ...]}
   *
   **/

  describe("GET /users/:username/to", function () {
    test("get messages to user if you are a valid user", async function () {

      let response = await request(app)
        .get("/users/test2/to")
        .send({ _token: testUserToken2});

      expect(response.statusCode).toBe(200);
      expect(response.body.messages.length).toEqual(2);
      expect(response.body.messages[1].body).toEqual('oh snap hello again!');
      });
  });

   /** GET /:username/to - can not access other person's message;
   **/

  describe("GET /users/:username/to", function () {
    test("unauthorized if you are not a valid user", async function () {
      let response = await request(app)
        .get("/users/test2/to")
        .send({ _token: testUserToken});

      expect(response.statusCode).toBe(401);
      });
  });




});

afterAll(async function () {
  await db.end();
})

