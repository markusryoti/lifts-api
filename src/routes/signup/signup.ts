import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

import {
  createNewUser,
  DbUser,
  getUserWithUsernameOrEmail,
} from '../repository/users';

router.post('/', async (req: any, res: any) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res
      .sendStatus(400)
      .send('Invalid request, must contain username, email and password');
  }

  try {
    const existingUser = await getUserWithUsernameOrEmail('email', email);

    if (existingUser) {
      return res.status(403).json('User with email already exists');
    }

    const hashedPassword = bcrypt.hashSync(
      password,
      parseInt(process.env.SALT_ROUNDS as string)
    );

    const newUser: DbUser = await createNewUser(
      username,
      email,
      hashedPassword
    );

    const payload = {
      id: newUser.id,
      username: newUser.username,
    };

    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, {
      expiresIn: process.env.TOKEN_EXPIRATION_TIME,
    });

    return res.json(token);
  } catch (err) {
    console.log(err.stack);
    return res.sendStatus(500);
  }
});

export default router;
