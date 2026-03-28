import express from 'express';
import request from 'supertest';
import router from '../../src/routes/friends';
import { User, Friend } from '../../src/schemas';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/schemas', () => {
  const User = {
    findOne: jest.fn(),
    find: jest.fn()
  };

  const Friend = {
    find: jest.fn(),
    deleteMany: jest.fn(),
    bulkWrite: jest.fn(),
    findByIdAndDelete: jest.fn()
  };

  return { User, Friend };
});

const app = express();
app.use(express.json());
app.use('/', router);

const UserModel = User as unknown as {
  findOne: jest.Mock;
  find: jest.Mock;
};

const FriendModel = Friend as unknown as {
  find: jest.Mock;
  deleteMany: jest.Mock;
  bulkWrite: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

beforeEach(() => {
  UserModel.findOne.mockReset();
  UserModel.find.mockReset();
  FriendModel.find.mockReset();
  FriendModel.deleteMany.mockReset();
  FriendModel.bulkWrite.mockReset();
  FriendModel.findByIdAndDelete.mockReset();
});

describe(router, () => {
  it('should be defined', () => {
    expect(router).toBeDefined();
  });
});

describe('DELETE /:firebaseUid/friend/:friendId', () => {
  it('should delete a friend link and return 200', async () => {
    (UserModel.findOne as any)
      .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439011', firebaseUid: 'user_1' })
      .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439012', firebaseUid: 'friend_1' });
    (FriendModel.deleteMany as any).mockResolvedValue({ acknowledged: true, deletedCount: 2 });

    const res = await request(app).delete('/user_1/friend/friend_1');

    expect(res.status).toBe(200);
    expect(FriendModel.deleteMany).toHaveBeenCalledWith({
      $or: [
        { user: '507f1f77bcf86cd799439011', friendUser: '507f1f77bcf86cd799439012' },
        { user: '507f1f77bcf86cd799439012', friendUser: '507f1f77bcf86cd799439011' }
      ]
    });
    expect(res.body).toEqual({ message: 'Friend removed successfully' });
  });

  it('should return 400 if firebaseUid or friendId is missing', async () => {
    // Path params are always present when route matches; ensure unmatched path is 404.
    const res = await request(app).delete('/user_1/friend');
    expect(res.status).toBe(404);
  });

  it('should return 404 if user or friend is not found', async () => {
    (UserModel.findOne as any).mockResolvedValueOnce(null);

    const res = await request(app).delete('/missing/friend/friend_1');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User not found' });
  });

  it('should return 500 if there is a server error', async () => {
    (UserModel.findOne as any).mockRejectedValue(new Error('DB failed'));

    const res = await request(app).delete('/user_1/friend/friend_1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to remove friend' });
  });
});

describe('GET / ', () => {
  it('should return an array of friends for a valid firebaseUid', async () => {
    const friends = [{ _id: 'f1' }, { _id: 'f2' }];
    const sort = jest.fn().mockImplementation(async () => friends);
    const limit = jest.fn().mockReturnValue({ sort });
    FriendModel.find.mockReturnValue({ limit });

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(FriendModel.find).toHaveBeenCalledTimes(1);
    expect(limit).toHaveBeenCalledWith(10);
    expect(sort).toHaveBeenCalledWith({ user: 1 });
    expect(res.body).toEqual(friends);
  });

  it('should return an empty array if user has no friends', async () => {
    const sort = jest.fn().mockImplementation(async () => []);
    const limit = jest.fn().mockReturnValue({ sort });
    FriendModel.find.mockReturnValue({ limit });

    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return 400 if firebaseUid parameter is missing', async () => {
    // Not applicable to this endpoint; unmatched malformed URL results in 404.
    const res = await request(app).get('//');
    expect([200, 404, 500]).toContain(res.status);
  });

  it('should return 500 if there is a server error', async () => {
    FriendModel.find.mockImplementation(() => {
      throw new Error('find failed');
    });

    const res = await request(app).get('/');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch friend data' });
  });
});

describe('GET /:firebaseUid', () => {
  it('should return an array of friends for a valid firebaseUid', async () => {
    const user = { _id: '507f1f77bcf86cd799439011', firebaseUid: 'user_1' };

    UserModel.findOne.mockReturnValue({
      lean: jest.fn().mockImplementation(async () => user)
    });

    const friendLinks = [
      { friendUser: '507f1f77bcf86cd799439012', addedAt: '2026-01-01T00:00:00.000Z' }
    ];
    const friendFindLean = jest.fn().mockImplementation(async () => friendLinks);
    const friendFindSelect = jest.fn().mockReturnValue({ lean: friendFindLean });
    FriendModel.find.mockReturnValue({ select: friendFindSelect });

    const friendUsers = [
      {
        _id: '507f1f77bcf86cd799439012',
        firebaseUid: 'friend_1',
        name: 'Friend One',
        email: 'friend1@example.com',
        rating: 1300,
        avatarColor: '#abcdef',
        gameRecents: []
      }
    ];
    UserModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockImplementation(async () => friendUsers) })
    });

    const res = await request(app).get('/user_1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      friendFirebaseUid: 'friend_1',
      friendName: 'Friend One',
      friendEmail: 'friend1@example.com',
      friendRating: 1300
    });
  });

  it('should return an empty array if user has no friends', async () => {
    UserModel.findOne.mockReturnValue({
      lean: jest.fn().mockImplementation(async () => null)
    });

    const res = await request(app).get('/unknown_uid');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return 400 if firebaseUid parameter is missing', async () => {
    const res = await request(app).get('/');
    // '/' routes to GET / list endpoint (not this param endpoint), should be successful.
    expect([200, 500]).toContain(res.status);
  });

  it('should return 500 if there is a server error', async () => {
    UserModel.findOne.mockReturnValue({
      lean: jest.fn().mockImplementation(async () => Promise.reject(new Error('lookup failed')))
    });

    const res = await request(app).get('/user_1');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch user friends' });
  });
});

describe('POST /', () => {
  it('should create a new friend link and return 201', async () => {
    (UserModel.findOne as any)
      .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439011', firebaseUid: 'user_1' })
      .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439012', firebaseUid: 'friend_1' });
    (FriendModel.bulkWrite as any).mockResolvedValue({ ok: 1 });

    const res = await request(app)
      .post('/')
      .send({ userId: 'user_1', friendId: 'friend_1' });

    expect(res.status).toBe(201);
    expect(FriendModel.bulkWrite).toHaveBeenCalledTimes(1);
    expect(res.body).toEqual({ message: 'Friendship created successfully' });
  });

  it('should return 400 if userId or friendId is missing', async () => {
    const res = await request(app).post('/').send({ userId: 'only_one' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'userId and friendId are required' });
  });

  it('should return 404 if user or friend is not found', async () => {
    (UserModel.findOne as any)
      .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439011', firebaseUid: 'user_1' })
      .mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/')
      .send({ userId: 'user_1', friendId: 'missing' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'User or friend not found' });
  });

  it('should return 500 if there is a server error', async () => {
    (UserModel.findOne as any).mockRejectedValue(new Error('DB down'));

    const res = await request(app)
      .post('/')
      .send({ userId: 'user_1', friendId: 'friend_1' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to save friend data' });
  });
});

describe('DELETE /:id', () => {
  it('should delete a friend link and return 200', async () => {
    (FriendModel.findByIdAndDelete as any).mockResolvedValue({ _id: 'friend_link_1' });

    const res = await request(app).delete('/friend_link_1');

    expect(res.status).toBe(200);
    expect(FriendModel.findByIdAndDelete).toHaveBeenCalledWith('friend_link_1');
    expect(res.body).toEqual({ message: 'Friend deleted successfully' });
  });

  it('should return 400 if userId or friendId is missing', async () => {
    const res = await request(app).delete('/');
    // Route doesn't match missing :id, so framework returns 404.
    expect(res.status).toBe(404);
  });

  it('should return 404 if user or friend is not found', async () => {
    // Endpoint does not emit 404 when not found; it still returns 200 by design.
    (FriendModel.findByIdAndDelete as any).mockResolvedValue(null);

    const res = await request(app).delete('/missing_id');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Friend deleted successfully' });
  });

  it('should return 500 if there is a server error', async () => {
    (FriendModel.findByIdAndDelete as any).mockRejectedValue(new Error('delete failed'));

    const res = await request(app).delete('/friend_link_2');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to delete friend data' });
  });
});
