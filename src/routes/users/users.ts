import express from 'express';
const router = express.Router();

import auth from '../../middleware/auth';
import { DbUser, getUserWithUsernameOrEmail } from '../repository/users';

router.get('/:username', auth, async (req: any, res: any) => {
  const userId = req.user.id;
  const { username } = req.params;

  try {
    const user: DbUser | null = await getUserWithUsernameOrEmail(
      'username',
      username
    );

    if (!user) {
      res.status(404).json('No user exists with given username');
    }

    if (user?.id !== userId) {
      res.status(401).json('Unauthorized to view other users data');
    }

    delete user?.password;

    res.send(user);
  } catch (error) {
    console.log(error.stack);
    res.sendStatus(500);
  }
});

export default router;
