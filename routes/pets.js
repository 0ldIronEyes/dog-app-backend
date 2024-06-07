"use strict";

/** Routes for pets. */

const express = require("express");
const {DogBreed} = require("../models.js");
const axios = require('axios');
const { getPetfinderAccessToken, isTokenExpired, refreshTokenIfNeeded, checkAccessToken,
    DOGBREEDDB_API_KEY, PETFINDER_API_KEY, SECRET, petfinderAccessToken
 } 
= require("../helpers/petfinderHelper.js");

const router = express.Router();



router.get("get/:breedname", async function (req, res, next) {
    try {
      const breedinfo = await DogBreed.get(req.params.breedname);
      console.log(breedinfo);
      return res.json({ breedinfo });
    } catch (err) {
      return next(err);
    }
  });
  
  
  // fetch pets from Petfinder API
  router.get('/find', checkAccessToken, async (req, res) => {
      try {     
        const response = await axios.get('https://api.petfinder.com/v2/animals', {
          headers: {
            Authorization: `Bearer ${petfinderAccessToken}`,
          },
          params: {
            "type": "dog",
            "breed": req.query.breed,
            "location": req.query.location,
            "distance" : 100
          }
        });
        return res.json(response.data);
      } catch (error) {
        console.error('Error fetching pets:', error);
        res.status(500).json({ error: 'Failed to fetch pets' });
      }
  });
    
  router.get('/all', async (req, res) => {
    try {
      const searchQuery= req.query.search;
      const response = await axios.get(`https://dogbreeddb.p.rapidapi.com/`,{
      headers: {
        'X-RapidAPI-Key': `${DOGBREEDDB_API_KEY}`,
        'X-RapidAPI-Host': 'dogbreeddb.p.rapidapi.com'
      },
      params: {search: searchQuery }
      });
     
      const dogBreeds = response.data;
     
     res.json( dogBreeds );
    } catch (error) {
      console.error('Error fetching dog breeds:', error);
      res.status(500).json({ error: 'An error occurred while fetching dog breeds' });
    }
  });
  
  router.get('/age', async (req, res) => {
    try {
      const ageLimit= req.query.age;
      const response = await axios.get(`https://dogbreeddb.p.rapidapi.com/`,{
      headers: {
        'X-RapidAPI-Key': `${DOGBREEDDB_API_KEY}`,
        'X-RapidAPI-Host': 'dogbreeddb.p.rapidapi.com'
      }
      });
  
      const dogBreeds = response.data;
      const retdogBreeds = dogBreeds.filter(breed => breed.maxLifeSpan >= ageLimit);

     res.json( retdogBreeds );
    } catch (error) {
      console.error('Error fetching dog breeds:', error);
      res.status(500).json({ error: 'An error occurred while fetching dog breeds' });
    }
  });
  
  router.get('/weight', async (req, res) => {
    try {
      const weightLimit= req.query.weightLimit;
      const response = await axios.get(`https://dogbreeddb.p.rapidapi.com/`,{
      headers: {
        'X-RapidAPI-Key': `${DOGBREEDDB_API_KEY}`,
        'X-RapidAPI-Host': 'dogbreeddb.p.rapidapi.com'
      }
      });

      const dogBreeds = response.data;
      const retdogBreeds = dogBreeds.filter(breed => breed.maxWeightPounds <= weightLimit);
 
     res.json( retdogBreeds );
    } catch (error) {
      console.error('Error fetching dog breeds:', error);
      res.status(500).json({ error: 'An error occurred while fetching dog breeds' });
    }
  });
  
  
  router.get('/height', async (req, res) => {
    try {
      const heightLimit= req.query.heightLimit;
      const response = await axios.get(`https://dogbreeddb.p.rapidapi.com/`,{
      headers: {
        'X-RapidAPI-Key': `${DOGBREEDDB_API_KEY}`,
        'X-RapidAPI-Host': 'dogbreeddb.p.rapidapi.com'
      }
      });
    
      const dogBreeds = response.data;
      const retdogBreeds = dogBreeds.filter(breed => breed.maxHeightInches <= heightLimit);
     
     res.json( retdogBreeds );
    } catch (error) {
      console.error('Error fetching dog breeds:', error);
      res.status(500).json({ error: 'An error occurred while fetching dog breeds' });
    }
  });
  
  
  router.get('/id', async (req, res) => {
    try {
      const ID= req.query.id;
      const response = await axios.get(`https://dogbreeddb.p.rapidapi.com/`,{
      headers: {
        'X-RapidAPI-Key': `${DOGBREEDDB_API_KEY}`,
        'X-RapidAPI-Host': 'dogbreeddb.p.rapidapi.com'
      },
      params: {id: ID }
      });
      const dogBreed = response.data;
  
     res.json(dogBreed );
    } catch (error) {
      console.error('Error fetching dog breeds:', error);
      res.status(500).json({ error: 'An error occurred while fetching dog breeds' });
    }
  });
  
  module.exports = router;