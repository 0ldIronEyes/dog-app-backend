
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    userlocation VARCHAR(50),
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE dogbreeds (
    breed_id SERIAL PRIMARY KEY ,
    breedname VARCHAR(50) UNIQUE NOT NULL,
    lifespan VARCHAR(50),
    weight VARCHAR(50),
    height VARCHAR(50)
);


CREATE TABLE user_favorites (
    favorite_id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    breedname VARCHAR(50),
    FOREIGN KEY (username) REFERENCES users(username),
    FOREIGN KEY (breedname) REFERENCES dogbreeds(breedname)
);