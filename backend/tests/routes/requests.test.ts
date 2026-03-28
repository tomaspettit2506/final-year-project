import express from 'express';
import request from 'supertest';
import router from '../../src/routes/requests';
import { Request, User, Friend } from '../../src/schemas';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/schemas', () => {
  const Request = jest.fn();
  (Request as any).findById = jest.fn();
  (Request as any).findByIdAndDelete = jest.fn();
  (Request as any).find = jest.fn();
  (Request as any).findOne = jest.fn();

  const User = {
    findOne: jest.fn()
  };

  const Friend = {
    bulkWrite: jest.fn()
  };

  return { Request, User, Friend };
});

const app = express();
app.use(express.json());

const emit = jest.fn();
const to = jest.fn().mockReturnValue({ emit });
app.locals.io = { to };

app.use('/', router);

const RequestModel = Request as unknown as jest.Mock & {
  findById: jest.Mock;
  findByIdAndDelete: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
};

const UserModel = User as unknown as {
  findOne: jest.Mock;
};

const FriendModel = Friend as unknown as {
  bulkWrite: jest.Mock;
};

beforeEach(() => {
  RequestModel.mockReset();
  RequestModel.findById.mockReset();
  RequestModel.findByIdAndDelete.mockReset();
  RequestModel.find.mockReset();
  RequestModel.findOne.mockReset();
  UserModel.findOne.mockReset();
  FriendModel.bulkWrite.mockReset();
  emit.mockReset();
  to.mockClear();
});

describe(router, () => {
  it('should be defined', () => {
    expect(router).toBeDefined();
  });
});

describe('POST /:id/accept', () => {
  it('should accept a friend request', async () => {
    const save = jest.fn().mockImplementation(async () => undefined);
    const requestDoc = {
      _id: 'req-1',
      status: 'pending',
      fromUser: { _id: 'u1', firebaseUid: 'from_uid', name: 'From User', rating: 1000 },
      toUser: { _id: 'u2', firebaseUid: 'to_uid', name: 'To User', rating: 1200 },
      save
    };

    RequestModel.findById.mockReturnValue({
      populate: jest.fn().mockImplementation(async () => requestDoc)
    });
    FriendModel.bulkWrite.mockImplementation(async () => ({}));

    const res = await request(app).post('/req-1/accept');

    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalledTimes(1);
    expect(requestDoc.status).toBe('accepted');
    expect(FriendModel.bulkWrite).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith('user_from_uid');
    expect(emit).toHaveBeenCalledWith(
      'request_accepted',
      expect.objectContaining({ requestId: 'req-1', acceptedByUserId: 'to_uid' })
    );
  });

  it('should return 404 if request is not found', async () => {
    RequestModel.findById.mockReturnValue({
      populate: jest.fn().mockImplementation(async () => null)
    });

    const res = await request(app).post('/missing/accept');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Request not found' });
  });

  it('should return 400 if request is already processed', async () => {
    RequestModel.findById.mockReturnValue({
      populate: jest.fn().mockImplementation(async () => ({
        _id: 'req-2',
        status: 'accepted',
        fromUser: { _id: 'u1' },
        toUser: { _id: 'u2' },
        save: jest.fn()
      }))
    });

    const res = await request(app).post('/req-2/accept');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Request already processed' });
  });

  it('should return 500 if there is a server error', async () => {
    RequestModel.findById.mockImplementation(() => {
      throw new Error('DB failure');
    });

    const res = await request(app).post('/boom/accept');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to accept request' });
  });
});

describe('DELETE /:id/decline', () => {
  it('should decline a friend request', async () => {
    RequestModel.findByIdAndDelete.mockImplementation(async () => ({ _id: 'req-3' }));

    const res = await request(app).delete('/req-3/decline');

    expect(res.status).toBe(200);
    expect(RequestModel.findByIdAndDelete).toHaveBeenCalledWith('req-3');
    expect(res.body).toEqual({ message: 'Friend request declined successfully' });
  });

  it('should return 500 if there is a server error', async () => {
    (RequestModel.findByIdAndDelete as any).mockRejectedValue(new Error('delete failed'));

    const res = await request(app).delete('/req-4/decline');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to decline request' });
  });
});

describe('GET /', () => {
  it('should fetch incoming friend requests for a user', async () => {
    (UserModel.findOne as any).mockResolvedValue({ _id: 'u1', firebaseUid: 'firebase_u1' });
    const requests = [{ _id: 'r1' }, { _id: 'r2' }];
    const sort = jest.fn().mockImplementation(async () => requests);
    const populate = jest.fn().mockReturnValue({ sort });
    RequestModel.find.mockReturnValue({ populate });

    const res = await request(app).get('/').query({ userId: 'firebase_u1' });

    expect(res.status).toBe(200);
    expect(UserModel.findOne).toHaveBeenCalledWith({ firebaseUid: 'firebase_u1' });
    expect(RequestModel.find).toHaveBeenCalledWith({ toUser: 'u1', status: 'pending' });
    expect(res.body).toEqual(requests);
  });

  it('should return 400 if userId query parameter is missing', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'userId query parameter required' });
  });

  it('should return 500 if there is a server error', async () => {
    (UserModel.findOne as any).mockRejectedValue(new Error('lookup failed'));

    const res = await request(app).get('/').query({ userId: 'bad' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch request data' });
  });
});

describe('GET /sent', () => {
  it('should fetch outgoing friend requests for a user', async () => {
    (UserModel.findOne as any).mockResolvedValue({ _id: 'u5', firebaseUid: 'firebase_u5' });
    const requests = [{ _id: 's1' }];
    const sort = jest.fn().mockImplementation(async () => requests);
    const populate = jest.fn().mockReturnValue({ sort });
    RequestModel.find.mockReturnValue({ populate });

    const res = await request(app).get('/sent').query({ userId: 'firebase_u5' });

    expect(res.status).toBe(200);
    expect(RequestModel.find).toHaveBeenCalledWith({ fromUser: 'u5', status: 'pending' });
    expect(res.body).toEqual(requests);
  });

  it('should return 400 if userId query parameter is missing', async () => {
    const res = await request(app).get('/sent');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'userId query parameter required' });
  });

  it('should return 500 if there is a server error', async () => {
    (UserModel.findOne as any).mockRejectedValue(new Error('lookup failed'));

    const res = await request(app).get('/sent').query({ userId: 'bad' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch sent request data' });
  });
});

describe('POST /', () => {
  it('should send a friend request', async () => {
    (UserModel.findOne as any)
      .mockResolvedValueOnce({ _id: 'from-id', firebaseUid: 'from_uid', name: 'From', rating: 1100, avatarColor: '#111111' })
      .mockResolvedValueOnce({ _id: 'to-id', firebaseUid: 'to_uid' });
    (RequestModel.findOne as any).mockResolvedValue(null);

    const save = jest.fn().mockImplementation(async () => undefined);
    const populate = jest.fn().mockImplementation(async () => undefined);

    RequestModel.mockImplementation(() => ({
      _id: 'new-req-id',
      fromUser: 'from-id',
      toUser: 'to-id',
      createdAt: '2026-01-01T00:00:00.000Z',
      save,
      populate
    }));

    const res = await request(app)
      .post('/')
      .send({ fromUserId: 'from_uid', toUserId: 'to_uid' });

    expect(res.status).toBe(201);
    expect(UserModel.findOne).toHaveBeenCalledTimes(2);
    expect(RequestModel.findOne).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(populate).toHaveBeenCalledTimes(1);
    expect(to).toHaveBeenCalledWith('user_to_uid');
    expect(emit).toHaveBeenCalledWith(
      'request_received',
      expect.objectContaining({ requestId: 'new-req-id', fromUserId: 'from_uid' })
    );
  });

  it('should return 400 if fromUserId or toUserId is missing', async () => {
    const res = await request(app).post('/').send({ fromUserId: 'only-one' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'fromUserId and toUserId are required' });
  });

  it('should return 404 if sender or recipient user is not found', async () => {
    (UserModel.findOne as any).mockResolvedValue(null);

    const res = await request(app)
      .post('/')
      .send({ fromUserId: 'missing', toUserId: 'exists' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Sender user not found in database' });
  });

  it('should return 500 if there is a server error', async () => {
    (UserModel.findOne as any).mockRejectedValue(new Error('DB down'));

    const res = await request(app)
      .post('/')
      .send({ fromUserId: 'from_uid', toUserId: 'to_uid' });

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ error: 'Failed to save request data' });
  });
});

describe('DELETE /:id', () => {
  it('should delete a friend request', async () => {
    RequestModel.findByIdAndDelete.mockImplementation(async () => ({ _id: 'req-9' }));

    const res = await request(app).delete('/req-9');

    expect(res.status).toBe(200);
    expect(RequestModel.findByIdAndDelete).toHaveBeenCalledWith('req-9');
    expect(res.body).toEqual({ message: 'Request deleted successfully' });
  });

  it('should return 500 if there is a server error', async () => {
    (RequestModel.findByIdAndDelete as any).mockRejectedValue(new Error('delete failed'));

    const res = await request(app).delete('/req-10');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to delete request data' });
  });
});