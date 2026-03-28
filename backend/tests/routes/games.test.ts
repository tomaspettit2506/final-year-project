// @ts-nocheck
import express from 'express';
import request from 'supertest';
import router from '../../src/routes/games';
import { User, Game } from '../../src/schemas';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/schemas', () => {
  const User = {
    findById: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn()
  };

  const Game = {
    find: jest.fn(),
    findByIdAndDelete: jest.fn()
  };

  return { User, Game };
});

const app = express();
app.use(express.json());
app.use('/', router);

const UserModel = User as unknown as {
  findById: jest.Mock;
  findOne: jest.Mock;
  updateOne: jest.Mock;
  updateMany: jest.Mock;
};

const GameModel = Game as unknown as {
  find: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

const createFindChain = (games: any[]) => ({
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockResolvedValue(games)
});

beforeEach(() => {
  UserModel.findById.mockReset();
  UserModel.findOne.mockReset();
  UserModel.updateOne.mockReset();
  UserModel.updateMany.mockReset();
  GameModel.find.mockReset();
  GameModel.findByIdAndDelete.mockReset();
});

describe(router, () => {
  it('should be defined', () => {
    expect(router).toBeDefined();
  });
});

describe('GET /', () => {
  it('should return an array of games', async () => {
    GameModel.find.mockImplementation(() => createFindChain([{ _id: 'game_1', name: 'Test Game' }]));
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ _id: 'game_1', name: 'Test Game' }]);
  });
  
  it('should return 500 if there is a server error', async () => {
    GameModel.find.mockImplementation(() => ({
      limit: jest.fn(() => {
        throw new Error('Database error');
      })
    }));

    const res = await request(app).get('/');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch game data' });
  });
});

describe('GET /user/:id', () => {
  it('should return an array of games for the specified user', async () => {
    UserModel.findById.mockResolvedValue({ _id: 'user_1', gameRecents: [{ _id: 'game_1', name: 'Test Game' }] });
    const res = await request(app).get('/user/user_1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ _id: 'game_1', name: 'Test Game' }]);
  });

  it('should return 404 if user is not found', async () => {
    UserModel.findById.mockResolvedValue(null);
    const res = await request(app).get('/user/user_1');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });
  
  it('should return 404 if user ID path is missing', async () => {
    const res = await request(app).get('/user/');
    expect(res.status).toBe(404);
  });

  it('should return 500 if there is a server error', async () => {
    UserModel.findById.mockRejectedValue(new Error('Database error'));
    const res = await request(app).get('/user/user_1');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch user games' });
  });
});

describe('DELETE /:id', () => {
  it('should delete a game by ID', async () => {
    UserModel.updateMany.mockResolvedValue({ acknowledged: true, modifiedCount: 1 });
    GameModel.findByIdAndDelete.mockResolvedValue({ _id: 'game_1' });

    const res = await request(app).delete('/game_1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Game deleted successfully' });
    expect(UserModel.updateMany).toHaveBeenCalledWith(
      { 'gameRecents._id': 'game_1' },
      { $pull: { gameRecents: { _id: 'game_1' } } }
    );
    expect(GameModel.findByIdAndDelete).toHaveBeenCalledWith('game_1');
  });
  
  it('should return 404 if game ID path is missing', async () => {
    const res = await request(app).delete('/');
    expect(res.status).toBe(404);
  });

  it('should return 500 if there is a server error', async () => {
    UserModel.updateMany.mockRejectedValue(new Error('Database error'));
    const res = await request(app).delete('/game_1');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to delete game data' });
  });
});