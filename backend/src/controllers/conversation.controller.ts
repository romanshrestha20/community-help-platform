import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";
import { getZodErrorMessage } from "../utils/zod.js";
import {
    conversationIdParamSchema,
    messageIdParamSchema,
    paginationQuerySchema,
    requestIdParamSchema,
    sendConversationMessageBodySchema,
} from "../utils/validation-schemas.js";
import {
    createConversation,
    getConversationByIdForUser,
    getConversationByRequestIdForUser,
    listConversationMessages,
    listUserConversations,
    markConversationMessagesAsRead,
    sendConversationMessage,
    softDeleteConversationMessage,
} from "../services/conversation.service.js";

const handleResponse = <T>(res: Response, data: T, message?: string) => {
    res.json({
        success: true,
        data,
        message,
    });
};

const requireUserId = (req: Request): string | null => req.user?.userId ?? null;

const normalizeParamId = (value: string | string[] | undefined): string | null => {
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }

    if (Array.isArray(value) && value.length > 0) {
        const first = value[0];
        return typeof first === "string" && first.trim().length > 0 ? first : null;
    }

    return null;
};

export const ensureConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedParams = requestIdParamSchema.safeParse({
            requestId: normalizeParamId(req.params.requestId),
        });

        if (!parsedParams.success) {
            return next(new AppError(getZodErrorMessage(parsedParams.error), 400));
        }

        const conversation = await createConversation(parsedParams.data.requestId);
        handleResponse(res, conversation, "Conversation ready");
    } catch (error) {
        next(error);
    }
};

export const getConversationById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedParams = conversationIdParamSchema.safeParse({
            conversationId: normalizeParamId(req.params.conversationId),
        });

        if (!parsedParams.success) {
            return next(new AppError(getZodErrorMessage(parsedParams.error), 400));
        }

        const conversation = await getConversationByIdForUser(
            parsedParams.data.conversationId,
            userId
        );

        handleResponse(res, conversation);
    } catch (error) {
        next(error);
    }
};

export const getConversationByRequestId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedParams = requestIdParamSchema.safeParse({
            requestId: normalizeParamId(req.params.requestId),
        });

        if (!parsedParams.success) {
            return next(new AppError(getZodErrorMessage(parsedParams.error), 400));
        }

        const conversation = await getConversationByRequestIdForUser(
            parsedParams.data.requestId,
            userId
        );

        handleResponse(res, conversation);
    } catch (error) {
        next(error);
    }
};

export const getMyConversations = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedQuery = paginationQuerySchema.safeParse(req.query);
        if (!parsedQuery.success) {
            return next(new AppError(getZodErrorMessage(parsedQuery.error), 400));
        }

        const result = await listUserConversations({
            userId,
            page: parsedQuery.data.page,
            limit: parsedQuery.data.limit,
        });

        res.json({
            success: true,
            data: result.conversations,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

export const getConversationMessages = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedParams = conversationIdParamSchema.safeParse({
            conversationId: normalizeParamId(req.params.conversationId),
        });

        if (!parsedParams.success) {
            return next(new AppError(getZodErrorMessage(parsedParams.error), 400));
        }

        const parsedQuery = paginationQuerySchema.safeParse(req.query);
        if (!parsedQuery.success) {
            return next(new AppError(getZodErrorMessage(parsedQuery.error), 400));
        }

        const result = await listConversationMessages({
            conversationId: parsedParams.data.conversationId,
            userId,
            page: parsedQuery.data.page,
            limit: parsedQuery.data.limit,
        });

        res.json({
            success: true,
            data: result.messages,
            meta: result.meta,
        });
    } catch (error) {
        next(error);
    }
};

export const postConversationMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedParams = conversationIdParamSchema.safeParse({
            conversationId: normalizeParamId(req.params.conversationId),
        });

        if (!parsedParams.success) {
            return next(new AppError(getZodErrorMessage(parsedParams.error), 400));
        }

        const parsedBody = sendConversationMessageBodySchema.safeParse(req.body);
        if (!parsedBody.success) {
            return next(new AppError(getZodErrorMessage(parsedBody.error), 400));
        }

        const message = await sendConversationMessage({
            conversationId: parsedParams.data.conversationId,
            senderId: userId,
            content: parsedBody.data.content,
        });

        handleResponse(res, message, "Message sent");
    } catch (error) {
        next(error);
    }
};

export const readConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedParams = conversationIdParamSchema.safeParse({
            conversationId: normalizeParamId(req.params.conversationId),
        });

        if (!parsedParams.success) {
            return next(new AppError(getZodErrorMessage(parsedParams.error), 400));
        }

        await markConversationMessagesAsRead(parsedParams.data.conversationId, userId);

        handleResponse(res, null, "Conversation marked as read");
    } catch (error) {
        next(error);
    }
};

export const removeConversationMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = requireUserId(req);
        if (!userId) {
            return next(new AppError("Unauthorized", 401));
        }

        const parsedConversationParams = conversationIdParamSchema.safeParse({
            conversationId: normalizeParamId(req.params.conversationId),
        });

        if (!parsedConversationParams.success) {
            return next(new AppError(getZodErrorMessage(parsedConversationParams.error), 400));
        }

        const parsedMessageParams = messageIdParamSchema.safeParse({
            messageId: normalizeParamId(req.params.messageId),
        });

        if (!parsedMessageParams.success) {
            return next(new AppError(getZodErrorMessage(parsedMessageParams.error), 400));
        }

        await softDeleteConversationMessage(
            parsedConversationParams.data.conversationId,
            parsedMessageParams.data.messageId,
            userId
        );

        handleResponse(res, null, "Message deleted");
    } catch (error) {
        next(error);
    }
};
