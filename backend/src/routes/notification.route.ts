import { Router } from "express";
import {
    listNotifications,
    registerPushToken,
    unregisterPushToken,
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
router.post("/push-token", registerPushToken);
router.delete("/push-token", unregisterPushToken);
router.patch("/read-all", readAllNotifications);
router.patch("/:id/read", readNotification);
router.patch("/:id/unread", unreadNotification);
router.delete("/:id", removeNotification);

export default router;