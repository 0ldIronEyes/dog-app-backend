"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");
const axios = require('axios');
const express = require("express");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const User = require("../models/User.js");
const { createToken } = require("../helpers/tokens");
const userAuthSchema = require("../userAuth.json");
const userUpdateSchema = require("../userUpdate.json");
const userRegisterSchema = require("../userRegister.json");

const router = express.Router();



function ensureCorrectUser(req, res, next) {
    try {
      const user = res.locals.user;
      if (!(user && (user.username === req.params.username))) {
       throw new UnauthorizedError();
      }
      return next();
    } catch (err) {
      return next(err);
    }
  }
  

  router.post("/token", async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userAuthSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const { username, password } = req.body;
      const user = await User.authenticate(username, password);
      const token = createToken(user);
      return res.json({ token });
    } catch (err) {
      return next(err);
    }
  });
  
  
   router.post("/register", async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userRegisterSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
  
      const newUser = await User.register({ ...req.body });
      const token = createToken(newUser);
      return res.status(201).json({ token });
    } catch (err) {
      return next(err);
    }
  });
  
  
  
  // GET /[username] => { user }
  
  router.get("/:username", ensureCorrectUser, async function (req, res, next) {
    try {
      const user = await User.get(req.params.username);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  });
  
  
  /** PATCH /[username] { user } => { user }
   *
   * Data can include:
   *   { firstName, lastName, password, email }
   *
   * Returns { username, firstName, lastName, email }
   
   * Authorization required: admin or same-user-as-:username
   **/
  
  router.patch("/:username", ensureCorrectUser, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, userUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }
      try {
        await User.authenticate(req.params.username, req.body.password);
        } catch (err) {
        if (err instanceof UnauthorizedError) {
          return next(err); 
        }
        throw err; 
      }
      const user = await User.update(req.params.username, req.body);
      return res.json({ user });
    } catch (err) {
      return next(err);
    }
  });
  
  
  router.post("/:username/favorites/add/:breedname", async function (req, res, next) {
    try {
  
      const height = req.query.height;
      const weight = req.query.weight;
      const life = req.query.life;
      const {username, breedname} = req.params;
      await User.addFavoriteBreed(username, breedname, life, weight, height)
      return res.json({ favorited: breedname });
    } catch (err) {
      return next(err);
    }
  });
  
  router.post("/:username/favorites/remove/:breedname", async function (req, res, next) {
    try {
  
      const {username, breedname} = req.params;
      await User.removeFavoriteBreed(username, breedname)
      return res.json({ unfavorited: breedname });
    } catch (err) {
      return next(err);
    }
  });

  module.exports = router;