import { Router } from "express";
import {
    listNotifications,
    readAllNotifications,
    readNotification,
    removeNotification,
    unreadNotification,
    unreadNotificationCount,
} from "../controllers/notification.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticateUser);

router.get("/", listNotifications);
router.get("/unread-count", unreadNotificationCount);
router.patch("/read-all", readAllNotifications);
router.patch("/:id/read", readNotification);
router.patch("/:id/unread", unreadNotification);
router.delete("/:id", removeNotification);

export default router;