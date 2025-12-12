import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { io } from "../index.js";

export const friendController = {

  // Get friend list
  async getFriends(req: Request, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message : "Not authenticated" });
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



  // Search user by username
  async searchUser(req: Request, res: Response) {
    const username = req.query.username as string;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, name: true, avatar: true }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  },



  //  Send friend request (NEW version — uses username only)
  async sendRequest(req: Request, res: Response) {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const senderId = req.user.id;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    //  Prevent using numeric IDs (publicNumericId)
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

    // Prevent duplicate requests
    const exists = await prisma.friendRequest.findFirst({
      where: { senderId, receiverId }
    });

    if (exists) {
      return res.status(400).json({ message: "Request already sent" });
    }

    await prisma.friendRequest.create({
      data: { senderId, receiverId }
    });

    io.to(receiverId.toString()).emit("friend-request-received", { from: senderId })

    res.json({ message: "Friend request sent" });
  },



  // Get incoming requests
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



  // Accept friend request
  async acceptRequest(req: Request, res: Response) {
    const requestId = Number(req.params.id);

    const reqData = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!reqData) return res.status(404).json({ message: "Request not found" });

    const senderId = reqData.senderId;
    const receiverId = reqData.receiverId;

    // Check if already friends
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

    io.to(senderId.toString()).emit("friend-added", {
      friendId: receiverId,
    });

    io.to(receiverId.toString()).emit("friend-added", {
      friendId: senderId,
    })

    res.json({ message: "Friend added" });
  },



  // Reject friend request
  async rejectRequest(req: Request, res: Response) {
    const requestId = Number(req.params.id);

    await prisma.friendRequest.delete({
      where: { id: requestId }
    });

    res.json({ message: "Friend request rejected" });
  }

};

