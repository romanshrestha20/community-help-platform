import { Router } from "express";
import {
    getNotificationPreferences,
    listNotifications,
    registerPushToken,
    unregisterPushToken,
    readAllNotifications,
    readNotification,
    removeNotification,
    unreadNotification,
    unreadNotificationCount,
    updateNotificationPreferences,
} from "../controllers/notification.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { requireVerifiedUser } from "../middlewares/authorization.middleware.js";

const router = Router();

router.use(authenticateUser);
router.use(requireVerifiedUser);

router.get("/", listNotifications);
router.get("/preferences", getNotificationPreferences);
router.get("/unread-count", unreadNotificationCount);
router.patch("/preferences", updateNotificationPreferences);
router.post("/push-token", registerPushToken);
router.delete("/push-token", unregisterPushToken);
router.patch("/read-all", readAllNotifications);
router.patch("/:id/read", readNotification);
router.patch("/:id/unread", unreadNotification);
router.delete("/:id", removeNotification);

export default router;
