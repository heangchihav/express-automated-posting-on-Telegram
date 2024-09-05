import { Request, Response } from "express";
import prisma from "../libs/prisma";
import { User } from "@prisma/client";

// Create a new chat group
export const createChatGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, chatId } = req.body;
    const userId = (req.user as User).id;

    if (!name || !chatId) {
      res.status(400).json({ error: "Name and chatId are required" });
      return;
    }

    // Check if chatId is unique
    const existingChatGroup = await prisma.chatGroup.findUnique({
      where: { chatId },
    });

    if (existingChatGroup) {
      res.status(400).json({ error: "ChatId already exists" });
      return;
    }

    const chatGroup = await prisma.chatGroup.create({
      data: {
        name,
        chatId,
        user: { connect: { id: userId } },
      },
    });

    res.status(201).json({ message: "Chat group created successfully", chatGroup });
  } catch (error) {
    console.error("Error creating chat group:", error);
    res.status(500).json({ error: "Failed to create chat group" });
  }
};

// Update an existing chat group
export const updateChatGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, chatId } = req.body;

    const chatGroupId = parseInt(id);
    if (isNaN(chatGroupId)) {
      res.status(400).json({ error: "Invalid chat group ID" });
      return;
    }

    if (!name || !chatId) {
      res.status(400).json({ error: "Name and chatId are required" });
      return;
    }

    // Check if chatId is unique
    const existingChatGroup = await prisma.chatGroup.findUnique({
      where: { chatId },
    });

    if (existingChatGroup && existingChatGroup.id !== chatGroupId) {
      res.status(400).json({ error: "ChatId already exists" });
      return;
    }

    const chatGroup = await prisma.chatGroup.update({
      where: { id: chatGroupId },
      data: {
        name,
        chatId,
      },
    });

    res.status(200).json({ message: "Chat group updated successfully", chatGroup });
  } catch (error) {
    console.error("Error updating chat group:", error);
    res.status(500).json({ error: "Failed to update chat group" });
  }
};

// Delete a chat group by ID
export const deleteChatGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const chatGroupId = parseInt(id);
    if (isNaN(chatGroupId)) {
      res.status(400).json({ error: "Invalid chat group ID" });
      return;
    }

    await prisma.chatGroup.delete({
      where: { id: chatGroupId },
    });

    res.status(200).json({ message: "Chat group deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat group:", error);
    res.status(500).json({ error: "Failed to delete chat group" });
  }
};

// Get all chat groups for the authenticated user
export const getChatGroups = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req.user as User).id;

    const chatGroups = await prisma.chatGroup.findMany({
      where: { userId },
      orderBy: { name: "asc" }, // Order by name or any other field
    });

    res.status(200).json({ chatGroups });
  } catch (error) {
    console.error("Error retrieving chat groups:", error);
    res.status(500).json({ error: "Failed to retrieve chat groups" });
  }
};

// Get a chat group by ID for the authenticated user
export const getChatGroupById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req.user as User).id;

    const chatGroupId = parseInt(id);
    if (isNaN(chatGroupId)) {
      res.status(400).json({ error: "Invalid chat group ID" });
      return;
    }

    const chatGroup = await prisma.chatGroup.findFirst({
      where: { id: chatGroupId, userId },
    });

    if (!chatGroup) {
      res.status(404).json({ error: "Chat group not found" });
      return;
    }

    res.status(200).json({ chatGroup });
  } catch (error) {
    console.error("Error retrieving chat group by ID:", error);
    res.status(500).json({ error: "Failed to retrieve chat group" });
  }
};
