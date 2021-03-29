import express from 'express';
const router = express.Router();

import auth from '../../middleware/auth';

import {
  addMovementToMovementTable,
  addMovementToUserMovementTable,
  checkByNameIfMovementInUserMovements,
  getUserMovementIdByMovementName,
  seeIfMovementInMovementTable,
} from '../repository/movements';

import {
  createNewWorkout,
  deleteWorkoutById,
  insertToOrUpdateMovementTable,
  insertToUserMovementTable,
  linkSetsToWorkout,
  updateWorkoutName,
} from '../repository/workouts';

import {
  getUserTransformedWorkouts,
  getUserTransformedWorkoutById,
  ISet,
  createNewSet,
  updateWorkoutSets,
  deleteMovementFromWorkout,
  deleteSetByIdAndUserId,
} from '../repository/sets';

import { IWorkout } from '../repository/json';

router.get('/', auth, async (req: any, res: any) => {
  const userId = req.user.id;

  try {
    const transformedWorkouts = await getUserTransformedWorkouts(userId);
    return res.send(transformedWorkouts);
  } catch (error) {
    console.log(error.stack);
    return res.sendStatus(500);
  }
});

router.get('/:workoutId', auth, async (req: any, res: any) => {
  const userId = req.user.id;
  const { workoutId } = req.params;

  try {
    const transformedWorkoutById = await getUserTransformedWorkoutById(
      userId,
      workoutId
    );
    return res.send(transformedWorkoutById);
  } catch (error) {
    console.log(error.stack);
    return res.sendStatus(500);
  }
});

const addMissingSets = async (
  allSets: Array<ISet>,
  userId: string,
  userMovementIds: any,
  workoutId: string
) => {
  const setsWithAddedIds = [];
  for (const set of allSets) {
    if (set.set_id === '') {
      const newSet = await createNewSet(
        set.reps.toString(),
        set.weight.toString(),
        userId,
        userMovementIds[set.movement_name],
        workoutId
      );
      if (newSet) {
        setsWithAddedIds.push({ ...newSet, movement_name: set.movement_name });
        continue;
      }
      throw new Error('Error while updating set values');
    }
    setsWithAddedIds.push(set);
  }
  return setsWithAddedIds;
};

router.put('/:workoutId', auth, async (req: any, res: any) => {
  const userId = req.user.id;
  const { workoutId } = req.params;
  const editedWorkout: IWorkout = req.body;

  try {
    const workoutName = editedWorkout.workout_name;

    const nameUpdateResult = await updateWorkoutName(workoutName, workoutId);
    if (!nameUpdateResult) {
      return res.sendStatus(500);
    }

    const movementNames = editedWorkout.sets.map(set => set.movement_name);
    const uniqueNames = [...new Set(movementNames)];

    const userMovementIds: any = {};
    for (const name of uniqueNames) {
      const movementRow = await seeIfMovementInMovementTable(name);

      let movementId = '';
      let userMovementId;

      if (!movementRow) {
        const newMovement = await addMovementToMovementTable(name);
        if (!newMovement) {
          return res.sendStatus(500);
        }
        movementId = newMovement.id.toString();
      } else {
        movementId = movementRow.id.toString();
      }

      // See if exists with current user
      const userMovementRow = await checkByNameIfMovementInUserMovements(name);
      if (!userMovementRow) {
        const userMovementResponse = await addMovementToUserMovementTable(
          movementId,
          userId
        );

        if (!userMovementResponse) {
          res.sendStatus(500);
          return;
        }
        userMovementId = userMovementResponse.id;
      } else {
        userMovementId = userMovementRow.user_movement_id;
      }
      userMovementIds[name] = userMovementId;
    }

    const setsWithAddedIds = await addMissingSets(
      editedWorkout.sets,
      userId,
      userMovementIds,
      workoutId
    );

    await updateWorkoutSets(
      setsWithAddedIds,
      userId,
      workoutId,
      userMovementIds
    );

    return res.sendStatus(200);
  } catch (error) {
    console.log(error.stack);
    return res.sendStatus(500);
  }
});

router.delete('/:workoutId', auth, async (req: any, res: any) => {
  const userId = req.user.id;
  const { workoutId } = req.params;

  try {
    const success = await deleteWorkoutById(workoutId, userId);
    if (!success) {
      return res.sendStatus(500);
    }
    return res.sendStatus(200);
  } catch (error) {
    console.log(error.stack);
    return res.sendStatus(500);
  }
});

router.delete(
  '/:workoutId/sets/movement/:movementNameToDelete',
  auth,
  async (req: any, res: any) => {
    const userId = req.user.id;
    const { workoutId, movementNameToDelete } = req.params;

    try {
      const userMovementId = await getUserMovementIdByMovementName(
        decodeURI(movementNameToDelete),
        userId
      );
      if (!userMovementId) {
        res.sendStatus(500);
        return;
      }

      const deleteSuccess = await deleteMovementFromWorkout(
        workoutId,
        userId,
        userMovementId
      );
      if (!deleteSuccess) {
        res.sendStatus(500);
        return;
      }

      return res.sendStatus(200);
    } catch (error) {
      console.log(error.stack);
      return res.sendStatus(500);
    }
  }
);

router.post('/new', auth, async (req: any, res: any) => {
  const userId = req.user.id;
  const workout: IWorkout = req.body;

  try {
    // Create a new workout
    const newWorkoutId = await createNewWorkout(userId, workout.workout_name);
    if (!newWorkoutId) {
      return res.sendStatus(500);
    }

    const movementNames: string[] = workout.sets.map(
      item => item.movement_name
    );

    // Insert to movements table if needed, else do an update without new values
    // TODO remove duplicate checks/updates
    const movementIds: string[] = [];
    for (const movementName of movementNames) {
      const movementId = await insertToOrUpdateMovementTable(movementName);
      if (movementId) movementIds.push(movementId);
    }

    // Update user movements table if needed
    await insertToUserMovementTable(movementIds, userId);

    // Add workout/movement data to sets
    await linkSetsToWorkout(workout, movementIds, userId, newWorkoutId);

    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

router.post('/:workoutId/sets/', auth, async (req: any, res: any) => {
  const userId = req.user.id;

  const { workoutId } = req.params;
  const { reps, weight, userMovementId } = req.body;

  const inputsAreValid = (
    reps: number,
    userId: number,
    userMovementId: number
  ): boolean => {
    if (
      reps === undefined ||
      userId === undefined ||
      userMovementId === undefined
    )
      return false;
    return true;
  };

  try {
    if (!inputsAreValid(reps, userId, userMovementId)) {
      return res
        .status(403)
        .send('Not valid, must include reps, userId and userMovementId');
    }

    const weightToAdd = weight === undefined ? '' : weight;

    const addedSet = await createNewSet(
      reps,
      weightToAdd,
      userId,
      userMovementId,
      workoutId
    );
    if (!addedSet) {
      return res.sendStatus(500);
    }

    return res.send(addedSet);
  } catch (error) {
    console.log(error.stack);
    return res.sendStatus(500);
  }
});

router.delete(
  '/:workoutId/sets/set/:setId',
  auth,
  async (req: any, res: any) => {
    const userId = req.user.id;
    const { setId } = req.params;

    try {
      const deleteSuccess = await deleteSetByIdAndUserId(setId, userId);
      if (!deleteSuccess) {
        return res.sendStatus(500);
      }
      res.sendStatus(200);
    } catch (error) {
      console.log(error.stack);
      return res.sendStatus(500);
    }
  }
);

export default router;
