const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');
const jsonschema = require("jsonschema");
const {User, DogBreed} = require("./models.js");
const { createToken } = require("./helpers/tokens");
const { authenticateJWT } = require("./auth");
const { BadRequestError, UnauthorizedError } = require("./expressError");
const userAuthSchema = require("./userAuth.json");
const userUpdateSchema = require("./userUpdate.json");
const userRegisterSchema = require("./userRegister.json");


const PORT = process.env.PORT || 3001; 

app.use(express.json());
app.use(cors());

const DOGBREEDDB_API_KEY = "f6279f4ddbmsh069f02333435c3ap151352jsncced84bc0811"
const PETFINDER_API_KEY = "FyGKpuRKqsV5w5M8A3VzaeuL51yB05eIuNKByVDsM526hPD99X";
const SECRET = "kkmUznOGbMAyVPOeoTmgTDJqllXi43MWEPNg3Mvl";

let petfinderAccessToken = null;
let petfinderTokenExpiration = null

const getPetfinderAccessToken = async () => {
  try {
    const response = await axios.post('https://api.petfinder.com/v2/oauth2/token', {
      grant_type: 'client_credentials',
      client_id: `${PETFINDER_API_KEY}`,
      client_secret: `${SECRET}`,
    });

    petfinderAccessToken = response.data.access_token;
    petfinderTokenExpiration = Date.now() + response.data.expires_in * 1000;
  } catch (error) {
    console.error('Error fetching Petfinder access token:', error);
  }
};


const isTokenExpired = () => {
  return petfinderTokenExpiration && Date.now() >= petfinderTokenExpiration;
};

const refreshTokenIfNeeded = async () => {
  if (isTokenExpired()) {
  
    await getPetfinderAccessToken();
  }
};


getPetfinderAccessToken();

const checkAccessToken = async (req, res, next) => {
  try {
    await refreshTokenIfNeeded();
    if (!petfinderAccessToken) {
      return res.status(500).json({ error: 'Petfinder access token not available' });
    }
    next();
  } catch (error) {
    console.error('Error checking access token:', error);
    res.status(500).json({ error: 'An error occurred while checking access token' });
  }
};

app.use(authenticateJWT);

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


app.post("/users/token", async function (req, res, next) {
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


app.post("/users/register", async function (req, res, next) {
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

app.get("/users/:username", ensureCorrectUser, async function (req, res, next) {
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

app.patch("/users/:username", ensureCorrectUser, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    console.log(req.body);
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


app.post("/users/:username/favorites/add/:breedname", async function (req, res, next) {
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

app.post("/users/:username/favorites/remove/:breedname", async function (req, res, next) {
  try {

    const {username, breedname} = req.params;
    await User.removeFavoriteBreed(username, breedname)
    return res.json({ unfavorited: breedname });
  } catch (err) {
    return next(err);
  }
});


app.get("/breeds/:breedname", async function (req, res, next) {
  try {
    const breedinfo = await DogBreed.get(req.params.breedname);
    console.log(breedinfo);
    return res.json({ breedinfo });
  } catch (err) {
    return next(err);
  }
});


// fetch pets from Petfinder API
app.get('/api/find', checkAccessToken, async (req, res) => {
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
  
app.get('/api/breeds', async (req, res) => {
  try {
    const searchQuery= req.query.search;
    const response = await axios.get(`https://dogbreeddb.p.rapidapi.com/`,{
    headers: {
      'X-RapidAPI-Key': `${DOGBREEDDB_API_KEY}`,
      'X-RapidAPI-Host': 'dogbreeddb.p.rapidapi.com'
    },
    params: {search: searchQuery }
    });
    // Extract the list of dog breeds from the API response
    const dogBreeds = response.data;
    // Send the list of dog breeds as a JSON response
   res.json( dogBreeds );
  } catch (error) {
    console.error('Error fetching dog breeds:', error);
    res.status(500).json({ error: 'An error occurred while fetching dog breeds' });
  }
});

app.get('/api/age', async (req, res) => {
  try {
    const ageLimit= req.query.age;
    const response = await axios.get(`https://dogbreeddb.p.rapidapi.com/`,{
    headers: {
      'X-RapidAPI-Key': `${DOGBREEDDB_API_KEY}`,
      'X-RapidAPI-Host': 'dogbreeddb.p.rapidapi.com'
    }
    });
    // Extract the list of dog breeds from the API response
    const dogBreeds = response.data;
    const retdogBreeds = dogBreeds.filter(breed => breed.maxLifeSpan >= ageLimit);
    // Send the list of dog breeds as a JSON response
   res.json( retdogBreeds );
  } catch (error) {
    console.error('Error fetching dog breeds:', error);
    res.status(500).json({ error: 'An error occurred while fetching dog breeds' });
  }
});

app.get('/api/weight', async (req, res) => {
  try {
    const weightLimit= req.query.weightLimit;
    const response = await axios.get(`https://dogbreeddb.p.rapidapi.com/`,{
    headers: {
      'X-RapidAPI-Key': `${DOGBREEDDB_API_KEY}`,
      'X-RapidAPI-Host': 'dogbreeddb.p.rapidapi.com'
    }
    });
    // Extract the list of dog breeds from the API response
    const dogBreeds = response.data;
    const retdogBreeds = dogBreeds.filter(breed => breed.maxWeightPounds <= weightLimit);
    // Send the list of dog breeds as a JSON response
   res.json( retdogBreeds );
  } catch (error) {
    console.error('Error fetching dog breeds:', error);
    res.status(500).json({ error: 'An error occurred while fetching dog breeds' });
  }
});


app.get('/api/height', async (req, res) => {
  try {
    const heightLimit= req.query.heightLimit;
    const response = await axios.get(`https://dogbreeddb.p.rapidapi.com/`,{
    headers: {
      'X-RapidAPI-Key': `${DOGBREEDDB_API_KEY}`,
      'X-RapidAPI-Host': 'dogbreeddb.p.rapidapi.com'
    }
    });
    // Extract the list of dog breeds from the API response
    const dogBreeds = response.data;
    const retdogBreeds = dogBreeds.filter(breed => breed.maxHeightInches <= heightLimit);
    // Send the list of dog breeds as a JSON response
   res.json( retdogBreeds );
  } catch (error) {
    console.error('Error fetching dog breeds:', error);
    res.status(500).json({ error: 'An error occurred while fetching dog breeds' });
  }
});


app.get('/api/id', async (req, res) => {
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


app.get('/', async (req, res) => {
 return res.json( {message: "hello, world"});

});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});