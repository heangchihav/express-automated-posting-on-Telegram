import { Router } from "express";
import {
  createChatGroup,
  updateChatGroup,
  deleteChatGroup,
  getChatGroups,
  getChatGroupById,
} from "../controllers/chatGroupController";

const chatGroupRoutes = Router();

// Route to create a new chat group
chatGroupRoutes.post("/chatGroup/", createChatGroup);

// Route to update an existing chat group
chatGroupRoutes.put("/chatGroup/:id", updateChatGroup);

// Route to delete a chat group by ID
chatGroupRoutes.delete("/chatGroup/:id", deleteChatGroup);

// Route to get all chat groups for the authenticated user
chatGroupRoutes.get("/chatGroup/", getChatGroups);

// Route to get a chat group by ID for the authenticated user
chatGroupRoutes.get("/chatGroup/:id", getChatGroupById);

export default chatGroupRoutes;
