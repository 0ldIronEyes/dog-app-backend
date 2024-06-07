"use strict";

const db = require("../db.js");
const {
  NotFoundError,
} = require("../expressError.js");

const { BCRYPT_WORK_FACTOR } = require("../config.js");


class DogBreed {
  
    static async create(
      { breedname, lifespan, weight, height }) {
    const duplicateCheck = await db.query(
          `SELECT breedname
           FROM dogbreeds
           WHERE breedname = $1`,
        [breedname],
    );
  
    if (duplicateCheck.rows[0]) {
      return duplicateCheck.rows[0];
    }
  
    const result = await db.query(
          `INSERT INTO dogbreeds
           (breedname,
            lifespan,
            weight,
            height)
           VALUES ($1, $2, $3, $4)
           RETURNING breedname, lifespan, weight, height`,
        [
          breedname,
          lifespan,
          weight,
          height
        ],
    );
    const breed = result.rows[0];
    return breed;
    }
  
    static async get(breedname) {
      const breedRes = await db.query(
            `SELECT breedname,
                    lifespan,
                    weight,
                    height
             FROM dogbreeds
             WHERE breedname = $1`,
          [breedname],
      );
  
      const breed = breedRes.rows[0];
  
      if (!breed) throw new NotFoundError(`No breed found`);
  
      return breed;
    }
  
  } 

  module.exports = DogBreed;