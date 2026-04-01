import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { io } from "../index.js";
import { emitFriendStateToUsers } from "../services/friendRealtime.js";
import {
  friendRequestBodySchema,
  friendRequestIdParamsSchema,
  friendSearchQuerySchema,
  friendUserIdParamsSchema,
} from "../validations/friend.validation.js";
import { respondWithZodError } from "../utils/zodError.js";

async function getBlockRelation(userId: number, otherUserId: number) {
  return prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId },
      ],
    },
  });
}

export const friendController = {

  async getFriends(req: Request, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user.id;

    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ]
      },
      include: {
        user1: { select: { id: true, username: true, name: true, avatar: true } },
        user2: { select: { id: true, username: true, name: true, avatar: true } }
      }
    });

    const formatted = friends.map(f => {
      return f.user1.id === userId ? f.user2 : f.user1;
    });

    res.json({ friends: formatted });
  },

  async getBlockedUsers(req: Request, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const blockedUsers = await prisma.blockedUser.findMany({
      where: { blockerId: req.user.id },
      include: {
        blocked: {
          select: { id: true, username: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      blocked: blockedUsers.map((entry: typeof blockedUsers[number]) => ({
        ...entry.blocked,
        blockedAt: entry.createdAt,
      })),
    });
  },



  async searchUser(req: Request, res: Response) {
    const parsed = friendSearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return respondWithZodError(res, parsed.error);
    }

    const { username } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, name: true, avatar: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  },



  async sendRequest(req: Request, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const senderId = req.user.id;
    const parsed = friendRequestBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return respondWithZodError(res, parsed.error);
    }

    const { username } = parsed.data;

    if (/^\d+$/.test(username)) {
      return res.status(400).json({
        message: "Friend requests must use username, not numeric ID"
      });
    }

    const receiver = await prisma.user.findUnique({
      where: { username }
    });

    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const receiverId = receiver.id;

    if (senderId === receiverId) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    const blockRelation = await getBlockRelation(senderId, receiverId);
    if (blockRelation) {
      return res.status(403).json({ message: "Friend request unavailable because one user blocked the other" });
    }

    const alreadyFriends = await prisma.friend.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId },
        ],
      },
    });

    if (alreadyFriends) {
      return res.status(400).json({ message: "You are already friends" });
    }

    const reverseRequest = await prisma.friendRequest.findFirst({
      where: {
        senderId: receiverId,
        receiverId: senderId,
      },
    });

    if (reverseRequest) {
      return res.status(400).json({
        message: "This user already sent you a friend request",
      });
    }



    const exists = await prisma.friendRequest.findFirst({
      where: { senderId, receiverId }
    });

    if (exists) {
      return res.status(400).json({ message: "Request already sent" });
    }

    const request = await prisma.friendRequest.create({
      data: { senderId, receiverId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    io.to(`user:${receiverId}`).emit(
      "friend:request",
      {
        request: {
          id: request.id,
          from: request.sender,
          createdAt: request.createdAt,
        },
      }
    );

    await emitFriendStateToUsers(io, [senderId, receiverId]);

    res.json({ message: "Friend request sent" });
  },



  async pending(req: Request, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const senderId = req.user.id;

    const requests = await prisma.friendRequest.findMany({
      where: { senderId },
      include: {
        receiver: { select: { id: true, username: true, name: true, avatar: true } }
      }
    });

    const formatted = requests.map(r => ({
      id: r.id,
      to: r.receiver,
      createdAt: r.createdAt
    }));

    res.json({ requests: formatted })
  },

  async getRequests(req: Request, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user.id;

    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: userId },
      include: {
        sender: { select: { id: true, username: true, name: true, avatar: true } }
      }
    });

    res.json({ requests });
  },



  async acceptRequest(req: Request, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const currentUserId = req.user.id;
    const parsed = friendRequestIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return respondWithZodError(res, parsed.error);
    }

    const { id: requestId } = parsed.data;

    const reqData = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!reqData) return res.status(404).json({ message: "Request not found" });

    if (reqData.receiverId !== currentUserId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const senderId = reqData.senderId;
    const receiverId = reqData.receiverId;

    const blockRelation = await getBlockRelation(senderId, receiverId);
    if (blockRelation) {
      await prisma.friendRequest.delete({
        where: { id: requestId },
      });
      return res.status(403).json({ message: "Cannot accept while one user blocked the other" });
    }

    const alreadyFriends = await prisma.friend.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId },
        ],
      },
    });

    if (alreadyFriends) {
      await prisma.friendRequest.delete({
        where: { id: requestId },
      });
      return res.json({ message: "Already friends" });
    }

    await prisma.friend.create({
      data: {
        user1Id: senderId,
        user2Id: receiverId,
      },
    });

    await prisma.friendRequest.delete({
      where: { id: requestId },
    });

    const senderUser = await prisma.user.findUnique({
      where: { id: senderId },
      select: { id: true, username: true, name: true, avatar: true },
    })

    const receiverUser = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, username: true, name: true, avatar: true },
    })

    io.to(`user:${senderId}`).emit("friend:accepted", {
      friend: receiverUser,
    })

    io.to(`user:${receiverId}`).emit("friend:accepted", {
      friend: senderUser,
    })
    await emitFriendStateToUsers(io, [senderId, receiverId]);
    res.json({ message: "Friend added" });
  },


  async rejectRequest(req: Request, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const currentUserId = req.user.id;
    const parsed = friendRequestIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return respondWithZodError(res, parsed.error);
    }

    const { id: requestId } = parsed.data;

    const reqData = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!reqData) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (reqData.receiverId !== currentUserId && reqData.senderId !== currentUserId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.friendRequest.delete({
      where: { id: requestId },
    });

    io.to(`user:${reqData.senderId}`).emit("friend:rejected", {
      requestId,
    });

    await emitFriendStateToUsers(io, [reqData.senderId, reqData.receiverId]);

    res.json({ message: "Friend request rejected" });
  },

  async removeFriend(req: Request, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user.id;
    const parsed = friendUserIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return respondWithZodError(res, parsed.error);
    }

    const { userId: otherUserId } = parsed.data;

    const friendship = await prisma.friend.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: otherUserId },
          { user1Id: otherUserId, user2Id: userId },
        ],
      },
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friend not found" });
    }

    await prisma.friend.delete({
      where: { id: friendship.id },
    });

    await emitFriendStateToUsers(io, [userId, otherUserId]);
    io.to(`user:${userId}`).emit("friend:removed", { userId: otherUserId });
    io.to(`user:${otherUserId}`).emit("friend:removed", { userId });

    res.json({ message: "Friend removed" });
  },

  async blockUser(req: Request, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const blockerId = req.user.id;
    const parsed = friendUserIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return respondWithZodError(res, parsed.error);
    }

    const { userId: blockedId } = parsed.data;

    if (blockerId === blockedId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const blockedUser = await prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true, username: true, name: true, avatar: true },
    });

    if (!blockedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.blockedUser.upsert({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
      update: {},
      create: {
        blockerId,
        blockedId,
      },
    });

    await prisma.friend.deleteMany({
      where: {
        OR: [
          { user1Id: blockerId, user2Id: blockedId },
          { user1Id: blockedId, user2Id: blockerId },
        ],
      },
    });

    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: blockerId, receiverId: blockedId },
          { senderId: blockedId, receiverId: blockerId },
        ],
      },
    });

    await emitFriendStateToUsers(io, [blockerId, blockedId]);
    io.to(`user:${blockerId}`).emit("friend:blocked", { user: blockedUser });
    io.to(`user:${blockedId}`).emit("friend:removed", { userId: blockerId });

    res.json({ message: "User blocked", user: blockedUser });
  },

  async unblockUser(req: Request, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const blockerId = req.user.id;
    const parsed = friendUserIdParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return respondWithZodError(res, parsed.error);
    }

    const { userId: blockedId } = parsed.data;

    await prisma.blockedUser.deleteMany({
      where: {
        blockerId,
        blockedId,
      },
    });

    io.to(`user:${blockerId}`).emit("friend:unblocked", { userId: blockedId });
    await emitFriendStateToUsers(io, [blockerId]);
    res.json({ message: "User unblocked" });
  }

};
