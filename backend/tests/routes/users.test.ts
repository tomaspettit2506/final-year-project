import express from 'express';
import request from 'supertest';
import router from '../../src/routes/users';
import { User, Friend } from '../../src/schemas';
import { calculateStats } from '../../src/utils/statsCalculator';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/schemas', () => {
  const User = jest.fn();
  (User as any).find = jest.fn();
  (User as any).findOne = jest.fn();
  (User as any).findByIdAndUpdate = jest.fn();
  (User as any).findByIdAndDelete = jest.fn();

  const Friend = {
    find: jest.fn(),
    deleteMany: jest.fn()
  };

  return { User, Friend };
});

jest.mock('../../src/utils/statsCalculator', () => ({
  calculateStats: jest.fn()
}));

const app = express();
app.use(express.json());
app.use('/', router);

const UserModel = User as unknown as jest.Mock & {
  find: jest.Mock;
  findOne: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

const FriendModel = Friend as unknown as {
  find: jest.Mock;
  deleteMany: jest.Mock;
};

const mockCalculateStats = calculateStats as jest.Mock;

beforeEach(() => {
  UserModel.mockReset();
  UserModel.find.mockReset();
  UserModel.findOne.mockReset();
  UserModel.findByIdAndUpdate.mockReset();
  UserModel.findByIdAndDelete.mockReset();
  FriendModel.find.mockReset();
  FriendModel.deleteMany.mockReset();
  mockCalculateStats.mockReset();
});

describe(router, () => {
  it('should be defined', () => {
    expect(router).toBeDefined();
  });
});

describe('GET /', () => {
  it('should return an array of all users', async () => {
    const users = [
      { _id: 'u1', name: 'Alice', rating: 1400 },
      { _id: 'u2', name: 'Bob', rating: 1300 }
    ];

    const sort = jest.fn().mockImplementation(async () => users);
    const limit = jest.fn().mockReturnValue({ sort });
    UserModel.find.mockReturnValue({ limit });

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(users);
    expect(UserModel.find).toHaveBeenCalledTimes(1);
    expect(limit).toHaveBeenCalledWith(10);
    expect(sort).toHaveBeenCalledWith({ rating: -1 });
  });

  it('should return 500 if there is a server error', async () => {
    UserModel.find.mockImplementation(() => {
      throw new Error('DB unavailable');
    });

    const res = await request(app).get('/');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch user data' });
  });
});

describe('POST /', () => {
  it('should create a new user and return 201', async () => {
    const save = jest.fn().mockImplementation(async () => undefined);
    UserModel.mockImplementation((payload: any) => ({
      _id: 'new-user',
      ...payload,
      save
    }));

    const payload = {
      name: 'Charlie',
      email: 'charlie@example.com',
      rating: 1500,
      avatarColor: '#123456'
    };

    const res = await request(app).post('/').send(payload);

    expect(res.status).toBe(201);
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.body).toMatchObject(payload);
    expect(UserModel).toHaveBeenCalledWith(payload);
  });
  
  it('should return 500 if there is a server error', async () => {
    UserModel.mockImplementation(() => {
      throw new Error('Create failed');
    });

    const res = await request(app).post('/').send({ name: 'Bad User' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to save user data' });
  });
});

describe('POST /email/:email', () => {
  it('should return existing user if email exists', async () => {
    const existingUser = {
      _id: 'u10',
      name: 'Dana',
      email: 'dana@example.com',
      rating: 900,
      firebaseUid: 'fb_dana',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      toObject() {
        return {
          _id: this._id,
          name: this.name,
          email: this.email,
          rating: this.rating,
          firebaseUid: this.firebaseUid,
          createdAt: this.createdAt
        };
      }
    };

    (UserModel.findOne as any).mockResolvedValue(existingUser);

    const res = await request(app)
      .post('/email/dana@example.com')
      .send({ name: 'Dana Updated' });

    expect(res.status).toBe(200);
    expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'dana@example.com' });
    expect(res.body).toMatchObject({
      _id: 'u10',
      email: 'dana@example.com',
      firebaseUid: 'fb_dana'
    });
  });

  it('should create a new user if email does not exist', async () => {
    (UserModel.findOne as any).mockResolvedValue(null);
    const save = jest.fn().mockImplementation(async () => undefined);
    UserModel.mockImplementation((payload: any) => ({
      _id: 'u11',
      ...payload,
      createdAt: new Date('2025-02-02T00:00:00.000Z'),
      save,
      toObject() {
        return {
          _id: 'u11',
          ...payload,
          createdAt: new Date('2025-02-02T00:00:00.000Z')
        };
      }
    }));

    const res = await request(app)
      .post('/email/new@example.com')
      .send({ name: 'New User', rating: 777, firebaseUid: 'fb_new' });

    expect(res.status).toBe(200);
    expect(UserModel.findOne).toHaveBeenCalledWith({ firebaseUid: 'fb_new' });
    expect(save).toHaveBeenCalledTimes(1);
    expect(res.body).toMatchObject({
      _id: 'u11',
      email: 'new@example.com',
      firebaseUid: 'fb_new',
      name: 'New User',
      rating: 777
    });
  });

  it('should return 500 if there is a server error', async () => {
    (UserModel.findOne as any).mockRejectedValue(new Error('Lookup failed'));

    const res = await request(app)
      .post('/email/error@example.com')
      .send({ name: 'Error' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to get or create user' });
  });
});

describe('GET /:id', () => {
  it('should return user data for a valid Mongo _id', async () => {
    const foundUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Mongo User',
      email: 'mongo@example.com',
      createdAt: new Date('2025-03-03T00:00:00.000Z'),
      toObject() {
        return {
          _id: this._id,
          name: this.name,
          email: this.email,
          createdAt: this.createdAt
        };
      }
    };

    (UserModel.findOne as any).mockResolvedValue(foundUser);

    const res = await request(app).get('/507f1f77bcf86cd799439011');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ _id: '507f1f77bcf86cd799439011', name: 'Mongo User' });
  });
  
  it('should return 404 if user is not found', async () => {
    (UserModel.findOne as any).mockResolvedValue(null);

    const res = await request(app).get('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });

  it('should return 500 if there is a server error', async () => {
    (UserModel.findOne as any).mockRejectedValue(new Error('Lookup failed'));

    const res = await request(app).get('/user-error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch user' });
  });
});

describe('PUT /:id', () => {
  it('should update user data for a valid Mongo _id', async () => {
    // Implement test for updating user by Mongo _id
  });

  it('should return 404 if user is not found', async () => {
    // Implement test for user not found when updating
  });

  it('should return 500 if there is a server error', async () => {
    // Implement test for server error handling
  });
});

describe('GET /:id/games', () => {
  it('should return recent games for a valid Mongo _id', async () => {
    // Implement test for fetching recent games by Mongo _id
  });

  it('should return 404 if user is not found', async () => {
    // Implement test for user not found when fetching games
  });

  it('should return 500 if there is a server error', async () => {
    // Implement test for server error handling
  });

  it('should return recent games for a valid Firebase UID', async () => {
    // Implement test for fetching recent games by Firebase UID
  });
});

describe('GET /:id/stats', () => {
  it('should return recent stats for a valid Mongo _id', async () => {
    (UserModel.findOne as any).mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      gameRecents: [{ result: 'win' }, { result: 'loss' }]
    });
    mockCalculateStats.mockReturnValue({
      wins: 1,
      losses: 1,
      draws: 0,
      totalGames: 2,
      winRate: 50
    });

    const res = await request(app).get('/507f1f77bcf86cd799439011/stats');

    expect(res.status).toBe(200);
    expect(mockCalculateStats).toHaveBeenCalledWith([{ result: 'win' }, { result: 'loss' }]);
    expect(res.body).toEqual({
      wins: 1,
      losses: 1,
      draws: 0,
      totalGames: 2,
      winRate: 50
    });
  });

  it('should return 404 if user is not found', async () => {
    (UserModel.findOne as any).mockResolvedValue(null);

    const res = await request(app).get('/unknown/stats');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });

  it('should return 500 if there is a server error', async () => {
    (UserModel.findOne as any).mockRejectedValue(new Error('Stats failed'));

    const res = await request(app).get('/boom/stats');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to compute user stats' });
  });
});

describe('GET /:firebaseUid/friends', () => {
  it('should return an array of friends for a valid firebaseUid', async () => {
    // Implement test for fetching friends by firebaseUid
  });

  it('should return an empty array if user has no friends', async () => {
    // Implement test for user with no friends
  });

  it('should return 400 if firebaseUid parameter is missing', async () => {
    // Implement test for missing firebaseUid parameter
  });

   it('should return 500 if there is a server error', async () => {
    // Implement test for server error handling
  });
});

describe('DELETE /:firebaseUid/friend/:friendId', () => {
  it('should delete a friend link for valid firebaseUid and friendId', async () => {
    // Implement test for deleting a friend link
  });

  it('should return 404 if user or friend is not found', async () => {
    // Implement test for user or friend not found when deleting friend link
  });

  it('should return 500 if there is a server error', async () => {
    // Implement test for server error handling
  });
});

describe('DELETE /:id', () => {
  it('should delete a user for a valid Mongo _id', async () => {
    // Implement test for deleting a user by Mongo _id
  });

  it('should return 404 if user is not found', async () => {
    // Implement test for user not found when deleting
  });

  it('should return 500 if there is a server error', async () => {
    // Implement test for server error handling
   });
});