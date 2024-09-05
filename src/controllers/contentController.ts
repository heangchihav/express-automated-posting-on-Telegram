// src/controllers/contentController.ts
import { Request, Response } from "express";
import {
  createContentSchema,
  updateContentSchema,
} from "../schemas/contentSchema";
import prisma from "../libs/prisma";
import { User } from "@prisma/client";

// Add new content
export const addContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Validate request data
    const validatedData = createContentSchema.parse(req.body);
    const userId = (req.user as User).id;
    const { text, imageUrl, scheduleAt, frequency, active, endDate } =
      validatedData;

    const content = await prisma.content.create({
      data: {
        text,
        imageUrl,
        scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        frequency,
        active,
        user: { connect: { id: userId } },
      },
    });

    res.status(201).json({ message: "Content created successfully", content });
  } catch (error) {
    res
      .status(400)
      .json({ error: "Validation failed", details: (error as any).errors });
  }
};

// Update content
export const updateContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req.user as User).id;
    const { id } = req.params;
    const validatedData = updateContentSchema.parse(req.body);
    const { text, imageUrl, scheduleAt, frequency, active, endDate } =
      validatedData;

    const contentId = parseInt(id);
    if (isNaN(contentId)) {
      res.status(400).json({ error: "Invalid content ID" });
      return;
    }

    const content = await prisma.content.update({
      where: { id: contentId },
      data: {
        text,
        imageUrl,
        scheduleAt: scheduleAt ? new Date(scheduleAt) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        frequency,
        active,
        user: { connect: { id: userId } },
      },
    });

    res.status(200).json({ message: "Content updated successfully", content });
  } catch (error) {
    res.status(400).json({
      error: "Failed to update content",
      details: (error as any).errors,
    });
  }
};

// Delete content by ID
export const deleteContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const contentId = parseInt(id);
    if (isNaN(contentId)) {
      res.status(400).json({ error: "Invalid content ID" });
      return;
    }

    await prisma.content.delete({
      where: { id: contentId },
    });

    res.status(200).json({ message: "Content deleted successfully" });
  } catch (error) {
    console.error("Error deleting content:", error);
    res.status(500).json({ error: "Failed to delete content" });
  }
};

// Get all contents
export const getContents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const contents = await prisma.content.findMany({
      orderBy: { createdAt: "desc" }, // Order by creation time or any other field
    });

    res.status(200).json({ contents });
  } catch (error) {
    console.error("Error retrieving contents:", error);
    res.status(500).json({ error: "Failed to retrieve contents" });
  }
};

// Get content by ID
export const getContentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const contentId = parseInt(id);
    if (isNaN(contentId)) {
      res.status(400).json({ error: "Invalid content ID" });
      return;
    }

    const content = await prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      res.status(404).json({ error: "Content not found" });
      return;
    }

    res.status(200).json({ content });
  } catch (error) {
    console.error("Error retrieving content by ID:", error);
    res.status(500).json({ error: "Failed to retrieve content" });
  }
};
