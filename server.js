const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');
const jsonschema = require("jsonschema");
const {User, DogBreed} = require("./models.js");
const { createToken } = require("./helpers/tokens");
const { getPetfinderAccessToken } = require("./helpers/petfinderHelper.js");
const { authenticateJWT } = require("./auth");
const { BadRequestError, UnauthorizedError } = require("./expressError");
const userAuthSchema = require("./userAuth.json");
const userUpdateSchema = require("./userUpdate.json");
const userRegisterSchema = require("./userRegister.json");

const userRoutes = require("./routes/users.js");
const petsRoutes = require("./routes/pets.js");


const PORT = process.env.PORT || 3001; 

app.use(express.json());
app.use(cors());


getPetfinderAccessToken();


app.use(authenticateJWT);


app.use('/users', userRoutes);

app.use('/breeds', petsRoutes);


app.get('/', async (req, res) => {
 return res.json( {message: "hello, world"});

});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});