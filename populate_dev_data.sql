INSERT INTO users (username, email, password) VALUES ('markus', 'a@a.gmail.com', '123');
INSERT INTO users (username, email, password) VALUES ('john', 'j@j.gmail.com', '321');
INSERT INTO users (username, email, password) VALUES ('bob', 'b@b.gmail.com', '31231414');
INSERT INTO users (username, email, password) VALUES ('alice', 'a2@a.gmail.com', '765757');
INSERT INTO users (username, email, password) VALUES ('sue', 's@s.gmail.com', 'meow');

INSERT INTO workouts (name, user_id) VALUES ('työntävät, voima', 1);
INSERT INTO workouts (name, user_id) VALUES ('vetävät, voima', 1);
INSERT INTO workouts (name, user_id) VALUES ('työntävät, hypertrofia', 1);
INSERT INTO workouts (name, user_id) VALUES ('vetävät, hypertrofia', 1);

INSERT INTO movements (name) VALUES ('kyykky');
INSERT INTO movements (name) VALUES ('penkki');
INSERT INTO movements (name) VALUES ('maastaveto');

INSERT INTO user_movements (user_id, movement_id) VALUES (1,1);
INSERT INTO user_movements (user_id, movement_id) VALUES (1,2);
INSERT INTO user_movements (user_id, movement_id) VALUES (2,2);
INSERT INTO user_movements (user_id, movement_id) VALUES (2,3);

INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES (6, 130, 1, 1, 1);
INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES (6, 130, 1, 1, 1);
INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES (6, 130, 1, 1, 1);
INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES (5, 100, 1, 2, 1);
INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES (5, 100, 1, 2, 1);
INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES (5, 100, 1, 2, 1);
INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES (5,180,1,3,2);
INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES (5,180,1,3,2);
INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES (5,180,1,3,2);
INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES (10,35,1,4,4);
INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES (10,35,1,4,4);
INSERT INTO sets (reps, weight, user_id, user_movement_id, workout_id) VALUES (10,35,1,4,4);

