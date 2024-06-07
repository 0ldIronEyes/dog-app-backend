const axios = require('axios');

const DOGBREEDDB_API_KEY = "f6279f4ddbmsh069f02333435c3ap151352jsncced84bc0811";
const PETFINDER_API_KEY = "FyGKpuRKqsV5w5M8A3VzaeuL51yB05eIuNKByVDsM526hPD99X";
const SECRET = "kkmUznOGbMAyVPOeoTmgTDJqllXi43MWEPNg3Mvl";

let petfinderAccessToken = null;
let petfinderTokenExpiration = null;

const getPetfinderAccessToken = async () => {
  try {
    const response = await axios.post('https://api.petfinder.com/v2/oauth2/token', {
      grant_type: 'client_credentials',
      client_id: PETFINDER_API_KEY,
      client_secret: SECRET,
    });

    petfinderAccessToken = response.data.access_token;
    petfinderTokenExpiration = Date.now() + response.data.expires_in * 1000;
    return petfinderAccessToken;
  } catch (error) {
    console.error('Error fetching Petfinder access token:', error);
  }
};

const isTokenExpired = () => {
  return petfinderTokenExpiration && Date.now() >= petfinderTokenExpiration;
};

const refreshTokenIfNeeded = async () => {
  if (isTokenExpired() || !petfinderAccessToken) {
    return token = await getPetfinderAccessToken();
  }
  else return petfinderAccessToken;
};

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

module.exports = {
    getPetfinderAccessToken,
    isTokenExpired,
    refreshTokenIfNeeded,
    checkAccessToken,
    DOGBREEDDB_API_KEY,
    PETFINDER_API_KEY,
    SECRET,
    petfinderAccessToken,
    petfinderTokenExpiration
}
