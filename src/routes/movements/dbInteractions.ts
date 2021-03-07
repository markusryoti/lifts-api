import db from '../../db';
import {
  DbMovementObject,
  DatabaseMovementResponse,
  DbUserMovementObject,
  DatabaseUserMovementResponse,
  DbMovementUserMovementJoin,
} from './types';

export const seeIfMovementInMovementTable = async (
  name: string
): Promise<DbMovementObject | undefined> => {
  const sqlSeeIfExists = 'SELECT id, name FROM movements WHERE name = $1';
  const movementExistsResult: DatabaseMovementResponse = await db.query(
    sqlSeeIfExists,
    [name]
  );
  return movementExistsResult.rows[0];
};

export const addMovementToMovementTable = async (
  name: string
): Promise<DbMovementObject | undefined> => {
  const sqlAddToMovements =
    'INSERT INTO movements (name) VALUES ($1) RETURNING *';
  const movementAddResult: DatabaseMovementResponse = await db.query(
    sqlAddToMovements,
    [name]
  );
  return movementAddResult.rows[0];
};

export const seeIfMovementInUserMovementTable = async (
  id: string
): Promise<DbUserMovementObject | undefined> => {
  const sqlSeeIfExistsInUserMovements =
    'SELECT id, movement_id, user_id FROM user_movements WHERE movement_id = $1';
  const userMovementExistsResult: DatabaseUserMovementResponse = await db.query(
    sqlSeeIfExistsInUserMovements,
    [id]
  );
  return userMovementExistsResult.rows[0];
};

export const addMovementToUserMovementTable = async (
  movementId: string,
  userId: string
): Promise<DbUserMovementObject | undefined> => {
  const sqlAddToUserMovements =
    'INSERT INTO user_movements (movement_id, user_id) VALUES ($1, $2) RETURNING *';
  const userMovementAddResult: DatabaseUserMovementResponse = await db.query(
    sqlAddToUserMovements,
    [movementId, userId]
  );
  return userMovementAddResult.rows[0];
};

export const joinMovementAndUserMovementTables = async (
  movementId: string
): Promise<DbMovementUserMovementJoin | undefined> => {
  const sqlMovementJoin = `
      SELECT user_movements.id, user_movements.user_id, movements.name
      FROM user_movements
      JOIN movements
      ON user_movements.movement_id = movements.id
      WHERE user_movements.movement_id = $1`;
  const userMovementJoinResponse = await db.query(sqlMovementJoin, [
    movementId,
  ]);

  return userMovementJoinResponse.rows[0];
};
