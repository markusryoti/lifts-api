import express from 'express';
import cors from 'cors';

import db from './db';

import login from './routes/login/login';
import movements from './routes/movements/movements';
import signup from './routes/signup/signup';
import users from './routes/users/users';
import workouts from './routes/workouts/workouts';

const app = express();
const PORT = 5000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/signup', signup);
app.use('/login', login);
app.use('/users', users);
app.use('/workouts', workouts);
app.use('/movements', movements);

app.get('/', async (req, res) => {
  const result = await db.query('SELECT $1::text as message', ['Hello world!']);
  res.send(result.rows[0]); // Hello world!
});

app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
