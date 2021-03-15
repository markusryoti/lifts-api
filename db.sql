DROP TABLE IF EXISTS sets;
DROP TABLE IF EXISTS user_movements;
DROP TABLE IF EXISTS movements;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT current_timestamp,
  updated_at TIMESTAMP DEFAULT current_timestamp
);

CREATE TABLE workouts (
	id SERIAL PRIMARY KEY,
  	name VARCHAR(255) DEFAULT '',
	user_id INT REFERENCES users(id) ON DELETE CASCADE,
  	created_at TIMESTAMP DEFAULT current_timestamp,
  	updated_at TIMESTAMP DEFAULT current_timestamp
);

CREATE TABLE movements (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE user_movements (
	id SERIAL PRIMARY KEY,
	movement_id INT REFERENCES movements(id) ON DELETE CASCADE,
  	user_id INT REFERENCES users(id) ON DELETE CASCADE,
	created_at TIMESTAMP DEFAULT current_timestamp,
  	updated_at TIMESTAMP DEFAULT current_timestamp
);

CREATE TABLE sets (
  	id SERIAL PRIMARY KEY,
  	reps INT NOT NULL,
  	weight INT,
  	user_id INT REFERENCES users(id) ON DELETE CASCADE,
  	user_movement_id INT REFERENCES user_movements(id) ON DELETE CASCADE,
  	workout_id INT REFERENCES workouts (id) ON DELETE CASCADE,
  	created_at TIMESTAMP DEFAULT current_timestamp,
  	updated_at TIMESTAMP DEFAULT current_timestamp
);

