// @ts-nocheck
import express from 'express';
import request from 'supertest';
import router from '../../src/routes/gameInvites';
import { GameInvite, User } from '../../src/schemas';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGameInviteSave = jest.fn();
const mockGameInvitePopulate = jest.fn();

jest.mock('../../src/schemas', () => {
  const User = {
    findOne: jest.fn()
  };

  const GameInviteConstructor = jest.fn().mockImplementation((data: any) => ({
    _id: 'invite_1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...data,
    save: mockGameInviteSave,
    populate: mockGameInvitePopulate
  }));

  const GameInvite = Object.assign(GameInviteConstructor, {
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn()
  });

  return { GameInvite, User };
});

const app = express();
app.use(express.json());
app.locals.io = {
  to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  emit: jest.fn()
};
app.use('/', router);

const UserModel = User as unknown as {
  findOne: jest.Mock;
};

const GameInviteModel = GameInvite as unknown as jest.Mock & {
  findById: jest.Mock;
  findByIdAndDelete: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
};

beforeEach(() => {
  UserModel.findOne.mockReset();
  GameInviteModel.mockClear();
  GameInviteModel.findById.mockReset();
  GameInviteModel.findByIdAndDelete.mockReset();
  GameInviteModel.find.mockReset();
  GameInviteModel.findOne.mockReset();
  mockGameInviteSave.mockReset();
  mockGameInvitePopulate.mockReset();
});

describe(router, () => {
  it('should be defined', () => {
    expect(router).toBeDefined();
  });
});

describe('POST /:id/accept', () => {
  it('should accept a game invite', async () => {
    const invite = {
      _id: '507f1f77bcf86cd799439011',
      roomId: 'room_1',
      status: 'pending',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      save: jest.fn()
    };

    GameInviteModel.findById.mockResolvedValue(invite);

    const res = await request(app).post('/507f1f77bcf86cd799439011/accept');

    expect(res.status).toBe(200);
    expect(GameInviteModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(invite.save).toHaveBeenCalled();
    expect(res.body.roomId).toBe('room_1');
  });

  it('should return 404 if invite is not found', async () => {
    GameInviteModel.findById.mockResolvedValue(null);

    const res = await request(app).post('/507f1f77bcf86cd799439011/accept');

    expect(res.status).toBe(404);
    expect(GameInviteModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('should return 400 if invite is already processed', async () => {
    GameInviteModel.findById.mockResolvedValue({ status: 'accepted' });

    const res = await request(app).post('/507f1f77bcf86cd799439011/accept');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invite already processed' });
  });

  it('should return 400 if invite has expired', async () => {
    const invite = {
      status: 'pending',
      expiresAt: new Date(Date.now() - 5 * 60 * 1000),
      save: jest.fn()
    };

    GameInviteModel.findById.mockResolvedValue(invite);

    const res = await request(app).post('/507f1f77bcf86cd799439011/accept');

    expect(res.status).toBe(400);
    expect(invite.save).toHaveBeenCalled();
    expect(res.body).toEqual({ error: 'Invite has expired' });
  });

  it('should return 500 if there is a server error', async () => {
    GameInviteModel.findById.mockRejectedValue(new Error('Database error'));

    const res = await request(app).post('/507f1f77bcf86cd799439011/accept');

    expect(res.status).toBe(500);
    expect(GameInviteModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });
});

describe('DELETE /:id/decline', () => {
  it('should decline (delete) a game invite', async () => {
    GameInviteModel.findByIdAndDelete.mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });

    const res = await request(app).delete('/507f1f77bcf86cd799439011/decline');

    expect(res.status).toBe(200);
    expect(GameInviteModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });

  it('should return 500 if there is a server error', async () => {
    GameInviteModel.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

    const res = await request(app).delete('/507f1f77bcf86cd799439011/decline');

    expect(res.status).toBe(500);
    expect(GameInviteModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
  });
});

describe('GET /', () => {
  it('should return game invites for a user', async () => {
    UserModel.findOne.mockResolvedValue({ _id: 'mongo_user_1' });

    const chain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([
        { _id: 'invite_1', roomId: 'room_1', status: 'pending' }
      ])
    };

    GameInviteModel.find.mockImplementation(() => chain);

    const res = await request(app).get('/?toUserId=user_1');

    expect(res.status).toBe(200);
    expect(UserModel.findOne).toHaveBeenCalledWith({ firebaseUid: 'user_1' });
    expect(GameInviteModel.find).toHaveBeenCalledWith(expect.objectContaining({
      toUser: 'mongo_user_1',
      status: 'pending'
    }));
  });

  it('should return 400 if userId or toUserId query parameter is missing', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(400);
  });

  it('should return [] when target user is not found', async () => {
    UserModel.findOne.mockResolvedValue(null);

    const res = await request(app).get('/?toUserId=user_1');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /room/:roomId', () => {
  it('should return a game invite for the specified room', async () => {
    const secondPopulate = jest.fn().mockResolvedValue({
      _id: 'invite_1',
      roomId: 'room_1',
      status: 'pending'
    });

    const firstPopulateReturn = { populate: secondPopulate };
    const firstPopulate = jest.fn().mockReturnValue(firstPopulateReturn);

    GameInviteModel.findOne.mockReturnValue({ populate: firstPopulate });

    const res = await request(app).get('/room/room_1');

    expect(res.status).toBe(200);
    expect(GameInviteModel.findOne).toHaveBeenCalledWith({ roomId: 'room_1' });
  });

  it('should return 404 if no invite found for room', async () => {
    const secondPopulate = jest.fn().mockResolvedValue(null);
    const firstPopulateReturn = { populate: secondPopulate };
    const firstPopulate = jest.fn().mockReturnValue(firstPopulateReturn);

    GameInviteModel.findOne.mockReturnValue({ populate: firstPopulate });

    const res = await request(app).get('/room/room_1');

    expect(res.status).toBe(404);
  });

  it('should return 500 if there is a server error', async () => {
    GameInviteModel.findOne.mockImplementation(() => ({
      populate: jest.fn(() => {
        throw new Error('Database error');
      })
    }));

    const res = await request(app).get('/room/room_1');

    expect(res.status).toBe(500);
  });
});

describe('POST /', () => {
  it('should create a new game invite', async () => {
    UserModel.findOne
      .mockResolvedValueOnce({ _id: 'mongo_sender_1', firebaseUid: 'user_2', name: 'Sender', rating: 1200 })
      .mockResolvedValueOnce({ _id: 'mongo_receiver_1', firebaseUid: 'user_1', name: 'Receiver', rating: 1300 });

    GameInviteModel.findOne.mockResolvedValue(null);
    mockGameInviteSave.mockResolvedValue(undefined);
    mockGameInvitePopulate.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/')
      .send({ roomId: 'room_1', fromUserId: 'user_2', toUserId: 'user_1' });

    expect(res.status).toBe(201);
    expect(GameInviteModel.findOne).toHaveBeenCalledWith(expect.objectContaining({
      fromUser: 'mongo_sender_1',
      toUser: 'mongo_receiver_1',
      status: 'pending'
    }));
    expect(GameInviteModel).toHaveBeenCalledWith(expect.objectContaining({
      fromUser: 'mongo_sender_1',
      toUser: 'mongo_receiver_1',
      roomId: 'room_1',
      timeControl: '0',
      rated: false
    }));
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app).post('/').send({ roomId: 'room_1', fromUserId: 'user_2' });
    expect(res.status).toBe(400);
  });

  it('should return 404 if sender user is not found', async () => {
    UserModel.findOne.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/')
      .send({ roomId: 'room_1', fromUserId: 'user_2', toUserId: 'user_1' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Sender user not found in database' });
  });

  it('should return 500 if there is a server error', async () => {
    UserModel.findOne.mockRejectedValue(new Error('Database error'));

    const res = await request(app)
      .post('/')
      .send({ roomId: 'room_1', fromUserId: 'user_2', toUserId: 'user_1' });

    expect(res.status).toBe(500);
  });
});
