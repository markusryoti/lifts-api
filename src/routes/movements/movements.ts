import express from 'express';
const router = express.Router();

import {
  seeIfMovementInMovementTable,
  addMovementToMovementTable,
  seeIfMovementInUserMovementTable,
  addMovementToUserMovementTable,
  joinMovementAndUserMovementTables,
} from './dbInteractions';

router.post('/new', async (req: any, res: any) => {
  const { userId, name } = req.body;
  if (!userId) {
    res.status(400).send('Invalid request, must include user');
    return;
  }

  try {
    //   First see if exist in movements table
    //   If not, add it to there first
    let movement = await seeIfMovementInMovementTable(name);
    if (!movement) {
      movement = await addMovementToMovementTable(name);
    }

    //   Check if exists already
    //   If not, add
    const movementId = movement!.id.toString();

    let userMovement = await seeIfMovementInUserMovementTable(movementId);
    if (!userMovement) {
      userMovement = await addMovementToUserMovementTable(movementId, userId);
    }

    //   Finally return the join of movements and user_movements tables
    const userMovementJoin = await joinMovementAndUserMovementTables(
      movementId
    );
    if (userMovementJoin) {
      res.send(userMovementJoin);
      return;
    }

    res.send(500); // Something went wrong
  } catch (error) {
    console.log(error.stack);
    res.sendStatus(500);
  }
});

export default router;
