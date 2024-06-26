"use strict";

const db = require("../db.js");
const bcrypt = require("bcrypt");
const DogBreed = require("./DogBreed.js");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError.js");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email}
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT user_id,
                  username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  userlocation,
                  email
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, firstName, lastName, userlocation, email }) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            userlocation,
            email)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", userlocation, email`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          userlocation,
          email
        ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin }, ...]
   **/

  static async findAll() {
    const result = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  userlocation,
                  email,
                   FROM users
           ORDER BY username`,
    );

    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, is_admin, jobs }
   *   where jobs is { id, title, company_handle, company_name, state }
   *
   * Throws NotFoundError if user not found.
   **/

  static async get(username) {
      const userRes = await db.query(
            `SELECT username,
                    first_name AS "firstName",
                    last_name AS "lastName",
                    userlocation,
                    email      
            FROM users
            WHERE username = $1`,
          [username],
      );

      const user = userRes.rows[0];


      if (!user) throw new NotFoundError(`No user: ${username}`);

      const userBreedsRes = await db.query(
        `SELECT breedname
        FROM user_favorites
        WHERE username = $1`, [username]);

      user.breeds = userBreedsRes.rows.map(a=> a.breedname)

      return user;
  }



  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email }
   *
   * Returns { username, firstName, lastName, email }
   *
   * Throws NotFoundError if not found.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          firstName: "first_name",
          lastName: "last_name",
          userlocation: "userlocation"
        });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                userlocation,
                                email`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  

  static async addFavoriteBreed(username, breedname, lifespan, weight, height) {

    
    const preCheck = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`, [username]);

    const user = preCheck.rows[0];

    if (!user) throw new NotFoundError(`No username: ${username}`);

    const breedCheck = await db.query(
          `SELECT breedname
           FROM dogbreeds
           WHERE breedname = $1`, [breedname]);

    let breed = breedCheck.rows[0];
    if (!breed)
    {
      breed =  await DogBreed.create( {
        breedname :breedname,
        lifespan: lifespan,
        weight: weight,
        height: height
      });
    } 

    await db.query(
          `INSERT INTO user_favorites (username, breedname)
           VALUES ($1, $2)`,
        [username, breedname]);
  }

  static async removeFavoriteBreed(username, breedname) {

    const preCheck = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`, [username]);

    const user = preCheck.rows[0];

    if (!user) throw new NotFoundError(`No username: ${username}`);

    const breedCheck = await db.query(
          `SELECT breedname
           FROM dogbreeds
           WHERE breedname = $1`, [breedname]);

    let breed = breedCheck.rows[0];
    if (!breed)
    {
      throw new NotFoundError(`invalid breed: ${breedname}`);
    } 
    
    await db.query(
          `DELETE FROM user_favorites 
           WHERE username = $1 AND breedname = $2`,
        [username, breedname]);
  }
}


module.exports = User;
