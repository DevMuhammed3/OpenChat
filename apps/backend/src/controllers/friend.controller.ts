import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export const friendController = {

// Get friend list
async getFriends(req: Request, res: Response) {

  if (!req.user?.id) {
    return res.status(401).json({ message : "Get friend not found"});
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
    const friend = f.user1.id === userId ? f.user2 : f.user1;
    return friend;
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

  // Send friend request
  async sendRequest(req: Request, res: Response) {

    if(!req.user?.id){
      return () =>  res.status(401).json({message: "not found"})
    }

    const senderId = req.user.id;
    const receiverId = Number(req.params.id);

    if (senderId === receiverId) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    // Check if user exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if request already exists
    const exists = await prisma.friendRequest.findFirst({
      where: { senderId, receiverId }
    });

    if (exists) {
      return res.status(400).json({ message: "Request already sent" });
    }

    // Create friend request
    const request = await prisma.friendRequest.create({
      data: { senderId, receiverId }
    });

    res.json({ message: "Friend request sent", request });
  },

  // Get incoming requests
  async getRequests(req: Request, res: Response) {
    if(!req.user?.id){
      return () =>  res.status(401).json({message: "not found"})
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

  // Check if they are already friends (in either order)
  const alreadyFriends = await prisma.friend.findFirst({
    where: {
      OR: [
        { user1Id: senderId, user2Id: receiverId },
        { user1Id: receiverId, user2Id: senderId },
      ],
    },
  });

  if (alreadyFriends) {
    // Delete request only
    await prisma.friendRequest.delete({
      where: { id: requestId },
    });

    return res.json({ message: "Already friends" });
  }

  //  Create friendship
  await prisma.friend.create({
    data: {
      user1Id: senderId,
      user2Id: receiverId,
    },
  });

  //  Delete request after accepting
  await prisma.friendRequest.delete({
    where: { id: requestId },
  });

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

