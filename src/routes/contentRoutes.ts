// src/routes/contentRoutes.ts
import express from "express";
import {
  addContent,
  deleteContent,
  getContentById,
  getContents,
  updateContent,
} from "../controllers/contentController";

const contentRoutes = express.Router();

// Add new content
contentRoutes.post("/content", addContent);

// Update content status by ID
contentRoutes.patch("/content/:id/status", updateContent);

// Delete content by ID
contentRoutes.delete("/content/:id", deleteContent);

// Get content by ID
contentRoutes.get("/content/:id", getContentById);

// Get all contents for a user
contentRoutes.get("/user/:userId/contents", getContents);

export default contentRoutes;
