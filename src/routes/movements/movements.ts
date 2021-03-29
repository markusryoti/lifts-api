import express from 'express';
import {
  seeIfMovementInMovementTable,
  addMovementToMovementTable,
  seeIfMovementInUserMovementTable,
  addMovementToUserMovementTable,
  getMovementAndUserMovements,
} from '../repository/movements';
const router = express.Router();

router.post('/new', async (req: any, res: any) => {
  const { userId, name } = req.body;
  if (!userId) {
    return res.status(400).send('Invalid request, must include user');
  }

  try {
    //  First see if exist in movements table
    //  If not, add it to there first
    let movement = await seeIfMovementInMovementTable(name);
    if (!movement) {
      movement = await addMovementToMovementTable(name);
    }

    //  Check if exists already
    //  If not, add
    const movementId = movement!.id.toString();
    let userMovement = await seeIfMovementInUserMovementTable(
      movementId,
      userId
    );
    if (!userMovement) {
      userMovement = await addMovementToUserMovementTable(movementId, userId);
    }

    //   Finally return the join of movements and user_movements tables
    const userMovementJoin = await getMovementAndUserMovements(movementId);
    if (userMovementJoin) {
      return res.send(userMovementJoin);
    }

    return res.sendStatus(500); // Something went wrong
  } catch (error) {
    console.log(error.stack);
    return res.sendStatus(500);
  }
});

export default router;
