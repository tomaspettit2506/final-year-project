// @ts-nocheck
import express from 'express';
import request from 'supertest';
import router from '../../src/routes/messages';
import { Message } from '../../src/schemas';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/schemas', () => {
  const Message = {
    find: jest.fn(),
    updateMany: jest.fn(),
    countDocuments: jest.fn()
  };

  return { Message };
});

const app = express();
app.use(express.json());
app.use('/', router);

const MessageModel = Message as unknown as {
  find: jest.Mock;
  updateMany: jest.Mock;
  countDocuments: jest.Mock;
};

const createFindChain = (messages: any[]) => {
  const chain = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(messages)
  };
  return chain;
};

beforeEach(() => {
  MessageModel.find.mockReset();
  MessageModel.updateMany.mockReset();
  MessageModel.countDocuments.mockReset();
});

describe(router, () => {
  it('should be defined', () => {
    expect(router).toBeDefined();
  });
});

describe('GET /:userId/:friendId', () => {
  it('should return messages between user and friend', async () => {
    MessageModel.find.mockImplementation(() => createFindChain([
      { _id: '2', senderId: 'user_2', recipientId: 'user_1', text: 'Hello back', deleted: false },
      { _id: '1', senderId: 'user_1', recipientId: 'user_2', text: 'Hello', deleted: false }
    ]));

    const res = await request(app).get('/user_1/user_2');

    expect(res.status).toBe(200);
    expect(MessageModel.find).toHaveBeenCalledWith(expect.objectContaining({
      $or: [
        { senderId: 'user_1', recipientId: 'user_2' },
        { senderId: 'user_2', recipientId: 'user_1' }
      ],
      deleted: false
    }));
    expect(res.body).toEqual([
      { _id: '1', senderId: 'user_1', recipientId: 'user_2', text: 'Hello', deleted: false },
      { _id: '2', senderId: 'user_2', recipientId: 'user_1', text: 'Hello back', deleted: false }
    ]);
  });
  
  it('should return 404 if userId or friendId path is missing', async () => {
    const res = await request(app).get('/user_1/');
    expect(res.status).toBe(404);
  });

  it('should return 500 if there is a server error', async () => {
    MessageModel.find.mockImplementation(() => ({
      sort: jest.fn(() => {
        throw new Error('Database error');
      })
    }));

    const res = await request(app).get('/user_1/user_2');

    expect(res.status).toBe(500);
    expect(MessageModel.find).toHaveBeenCalledWith(expect.objectContaining({
      $or: [
        { senderId: 'user_1', recipientId: 'user_2' },
        { senderId: 'user_2', recipientId: 'user_1' }
      ],
      deleted: false
    }));
  });
});

describe('PUT /:userId/read/:friendId', () => {
  it('should mark messages as read between user and friend', async () => {
    (MessageModel.updateMany as any).mockResolvedValue({ acknowledged: true, modifiedCount: 1 });
    const res = await request(app).put('/user_1/read/user_2');

    expect(res.status).toBe(200);
    expect(MessageModel.updateMany).toHaveBeenCalledWith(
      {
        senderId: 'user_2',
        recipientId: 'user_1',
        read: false
      },
      { $set: { read: true } }
    );
    expect(res.body).toEqual({ success: true });
  });
  
  it('should return 404 if userId or friendId path is missing', async () => {
    const res = await request(app).put('/user_1/read/');
    expect(res.status).toBe(404);
  });

  it('should return 500 if there is a server error', async () => {
    (MessageModel.updateMany as any).mockRejectedValue(new Error('Database error'));
    const res = await request(app).put('/user_1/read/user_2');
    expect(res.status).toBe(500);
    expect(MessageModel.updateMany).toHaveBeenCalledWith(
      {
        senderId: 'user_2',
        recipientId: 'user_1',
        read: false
      },
      { $set: { read: true } }
    );
  });
});

describe('GET /:userId/unread', () => {
  it('should return the count of unread messages for the user', async () => {
    (MessageModel.countDocuments as any).mockResolvedValue(5);
    const res = await request(app).get('/user_1/unread');
    expect(res.status).toBe(200);
    expect(MessageModel.countDocuments).toHaveBeenCalledWith({
      recipientId: 'user_1',
      read: false,
      deleted: false
    });
    expect(res.body).toEqual({ count: 5 });
  });
  
  it('should return 404 if userId path is missing', async () => {
    const res = await request(app).get('/unread');
    expect(res.status).toBe(404);
  });

  it('should return 500 if there is a server error', async () => {
    (MessageModel.countDocuments as any).mockRejectedValue(new Error('Database error'));
    const res = await request(app).get('/user_1/unread');
    expect(res.status).toBe(500);
    expect(MessageModel.countDocuments).toHaveBeenCalledWith({
      recipientId: 'user_1',
      read: false,
      deleted: false
    });
  });
});