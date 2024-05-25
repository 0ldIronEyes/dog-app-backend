
INSERT INTO users (username, password, first_name, last_name, userlocation, email)
VALUES 
('johndoe', 'password123', 'John', 'Doe', '98007', 'johndoe@example.com'),
('janedoe', 'password123', 'Jane', 'Doe', '38117','janedoe@example.com'),
('alice', 'password123', 'Alice', 'Smith', '60332', 'alice@example.com');


INSERT INTO dogbreeds (breedname, lifespan, weight, height)
VALUES 
('Labrador Retriever', '10', '55', '24'),
('German Shepherd', '9', '50', '26'),
('Golden Retriever', '10', '55', '24'),
('Bulldog', '8', '40', '15'),
('Beagle', '12', '20', '15');


INSERT INTO user_favorites (username, breedname)
VALUES 
('johndoe', 'Labrador Retriever'),
('janedoe', 'German Shepherd')
('janedoe', 'Golden Retriever'), 
('alice', 'Bulldog'), 
('alice', 'Beagle'); 
