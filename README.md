# Lifts API

API for gym lift tracking app.

The idea of Lifts is to track what was actually done in the gym in each workout. This means that there can be as much or as little variation in the program.

## Database

Postgresql is used as a database.

## Dev server database

```
sudo docker run \
--name lifts-db \
-p 127.0.0.1:5433:5432 \
-e POSTGRES_DB=lifts \
-e POSTGRES_USER=devserver \
-e POSTGRES_PASSWORD=devserver-password \
postgres
```

For persisting the data add a path for the data directory you want for the command.

```
-v your-directory-here:/var/lib/postgresql/data \
```

## Models

### Users

- Id
- Username
- Email
- Password
- Created at
- Updated at

Basic stuff. Every other table holds a foreign key to this table. If user is deleted, everything is cascaded.

### Workouts

- Id
- Name
- Created at
- Updated at
- User id (fk)

Many to one relationship with users.

### User Movements

- Id
- Name
- User id (fk)
- Created at
- Updated at

Many to one relationship with users. These are specific for each user.
**_TODO_**: Is there a better way?

### Sets

- Id
- Reps
- Weight
- Movement id (fk)
- User id (fk)
- Workout id (fk)
- Created at
- Updated at

Many to one relationship with users, workouts and movements.
