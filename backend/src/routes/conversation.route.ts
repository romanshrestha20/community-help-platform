import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { requireVerifiedUser } from "../middlewares/authorization.middleware.js";
import {
    ensureConversation,
    getConversationById,
    getConversationByRequestId,
    getConversationMessages,
    getMyConversations,
    postConversationMessage,
    readConversation,
    removeConversationMessage,
} from "../controllers/conversation.controller.js";

const router = Router();

router.use(authenticateUser);
router.use(requireVerifiedUser);

router.get("/", getMyConversations);
router.get("/request/:requestId", getConversationByRequestId);
router.post("/request/:requestId/ensure", ensureConversation);
router.get("/:conversationId", getConversationById);
router.get("/:conversationId/messages", getConversationMessages);
router.post("/:conversationId/messages", postConversationMessage);
router.patch("/:conversationId/read", readConversation);
router.delete("/:conversationId/messages/:messageId", removeConversationMessage);

export default router;
