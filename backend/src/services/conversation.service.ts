import { prisma } from "../lib/prisma.js";
import AppError from "../utils/appError.js";
import {
    MessageType,
    NotificationType,
    Prisma,
    RequestStatus,
} from "../../generated/prisma/client.js";
import { createNotification } from "./notification.service.js";

type EnsureConversationInput = {
    requestId: string;
    actorUserId?: string;
};

type ListUserConversationsInput = {
    userId: string;
    page?: number;
    limit?: number;
};

type ListConversationMessagesInput = {
    conversationId: string;
    userId: string;
    page?: number;
    limit?: number;
    sort?: "asc" | "desc";
};

type SendMessageInput = {
    conversationId: string;
    senderId: string;
    content: string;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MESSAGE_MAX_LENGTH = 1000;
const HANDOFF_STARTER_NOTE = "Bid accepted. You can now coordinate through chat.";
const ACCEPTED_SYSTEM_MESSAGE = "Offer accepted. You can now coordinate the task here.";

type ConversationWithMembers = Prisma.ConversationGetPayload<{
    include: {
        request: {
            select: {
                id: true;
                title: true;
                status: true;
                requesterId: true;
                assignedHelperId: true;
            };
        };
        members: {
            include: {
                user: {
                    select: {
                        id: true;
                        email: true;
                        profile: {
                            select: {
                                fullName: true;
                                avatarUrl: true;
                            };
                        };
                    };
                };
            };
        };
    };
}>;

type MessageWithSender = Prisma.MessageGetPayload<{
    include: {
        sender: {
            select: {
                id: true;
                email: true;
                profile: {
                    select: {
                        fullName: true;
                        avatarUrl: true;
                    };
                };
            };
        };
        images: {
            select: {
                id: true;
                url: true;
                type: true;
                createdAt: true;
            };
        };
    };
}>;

const sanitizePagination = (page?: number, limit?: number) => {
    const safePage =
        Number.isFinite(page) && (page ?? 0) > 0
            ? Math.floor(page as number)
            : DEFAULT_PAGE;

    const safeLimit =
        Number.isFinite(limit) && (limit ?? 0) > 0
            ? Math.min(Math.floor(limit as number), MAX_LIMIT)
            : DEFAULT_LIMIT;

    return {
        page: safePage,
        limit: safeLimit,
        skip: (safePage - 1) * safeLimit,
    };
};

const formatConversation = (
    conversation: ConversationWithMembers,
    lastMessage: MessageWithSender | null,
    unreadCount: number,
    starterNote: string | null = null
) => ({
    id: conversation.id,
    request: conversation.request,
    members: conversation.members.map((member) => ({
        id: member.user.id,
        email: member.user.email,
        fullName: member.user.profile?.fullName ?? null,
        avatarUrl: member.user.profile?.avatarUrl ?? null,
        joinedAt: member.createdAt,
    })),
    lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            type: lastMessage.type,
            isRead: lastMessage.isRead,
            createdAt: lastMessage.createdAt,
            sender: {
                id: lastMessage.sender.id,
                email: lastMessage.sender.email,
                fullName: lastMessage.sender.profile?.fullName ?? null,
                avatarUrl: lastMessage.sender.profile?.avatarUrl ?? null,
            },
            images: lastMessage.images,
        }
        : null,
    unreadCount,
    starterNote,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
});

const buildStarterNote = (requestStatus: RequestStatus, hasMessages: boolean) => {
    if (requestStatus !== RequestStatus.ASSIGNED || hasMessages) {
        return null;
    }

    return HANDOFF_STARTER_NOTE;
};

const assertConversationMembership = async (conversationId: string, userId: string) => {
    const member = await prisma.conversationMember.findUnique({
        where: {
            conversationId_userId: {
                conversationId,
                userId,
            },
        },
    });

    if (!member) {
        throw new AppError("Conversation not found", 404);
    }
};

const ensureAcceptedSystemMessageInTransaction = async (
    tx: Prisma.TransactionClient,
    input: {
        conversationId: string;
        requesterId: string;
    }
) => {
    const existing = await tx.message.findFirst({
        where: {
            conversationId: input.conversationId,
            type: MessageType.SYSTEM,
            deletedAt: null,
            content: ACCEPTED_SYSTEM_MESSAGE,
        },
        select: { id: true },
    });

    if (existing) {
        return { created: false, messageId: existing.id };
    }

    const created = await tx.message.create({
        data: {
            conversationId: input.conversationId,
            senderId: input.requesterId,
            type: MessageType.SYSTEM,
            content: ACCEPTED_SYSTEM_MESSAGE,
            isRead: false,
        },
        select: { id: true },
    });

    await tx.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() },
    });

    return { created: true, messageId: created.id };
};

export const ensureConversationForRequestInTransaction = async (
    tx: Prisma.TransactionClient,
    requestId: string
) => {
    const request = await tx.helpRequest.findUnique({
        where: { id: requestId },
        select: {
            id: true,
            requesterId: true,
            assignedHelperId: true,
        },
    });

    if (!request) {
        throw new AppError("Help request not found", 404);
    }

    if (!request.assignedHelperId) {
        throw new AppError("Cannot create conversation until a helper is assigned", 400);
    }

    const createdOrExisting = await tx.conversation.upsert({
        where: { requestId },
        create: { requestId },
        update: {},
        include: {
            request: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    requesterId: true,
                    assignedHelperId: true,
                },
            },
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            profile: {
                                select: {
                                    fullName: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    await tx.conversationMember.createMany({
        data: [
            { conversationId: createdOrExisting.id, userId: request.requesterId },
            { conversationId: createdOrExisting.id, userId: request.assignedHelperId },
        ],
        skipDuplicates: true,
    });

    const systemMessageResult = await ensureAcceptedSystemMessageInTransaction(tx, {
        conversationId: createdOrExisting.id,
        requesterId: request.requesterId,
    });

    const conversation = await tx.conversation.findUnique({
        where: { id: createdOrExisting.id },
        include: {
            request: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    requesterId: true,
                    assignedHelperId: true,
                },
            },
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            profile: {
                                select: {
                                    fullName: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!conversation) {
        throw new AppError("Failed to initialize conversation", 500);
    }

    return {
        conversation,
        starterNote: buildStarterNote(conversation.request.status, false),
        systemMessageCreated: systemMessageResult.created,
        systemMessageId: systemMessageResult.messageId,
    };
};

export const ensureConversationForRequest = async ({
    requestId,
    actorUserId,
}: EnsureConversationInput) => {
    const request = await prisma.helpRequest.findUnique({
        where: { id: requestId },
        select: {
            id: true,
            requesterId: true,
            assignedHelperId: true,
        },
    });

    if (!request) {
        throw new AppError("Help request not found", 404);
    }

    if (!request.assignedHelperId) {
        throw new AppError("Cannot create conversation until a helper is assigned", 400);
    }

    if (
        actorUserId &&
        actorUserId !== request.requesterId &&
        actorUserId !== request.assignedHelperId
    ) {
        throw new AppError("Forbidden", 403);
    }

    const assignedHelperId = request.assignedHelperId;

    const conversationResult = await prisma.$transaction(async (tx) => {
        const createdOrExisting = await tx.conversation.upsert({
            where: { requestId },
            create: { requestId },
            update: {},
            include: {
                request: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        requesterId: true,
                        assignedHelperId: true,
                    },
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profile: {
                                    select: {
                                        fullName: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        await tx.conversationMember.createMany({
            data: [
                { conversationId: createdOrExisting.id, userId: request.requesterId },
                { conversationId: createdOrExisting.id, userId: assignedHelperId },
            ],
            skipDuplicates: true,
        });

        const systemMessageResult = await ensureAcceptedSystemMessageInTransaction(tx, {
            conversationId: createdOrExisting.id,
            requesterId: request.requesterId,
        });

        const conversation = await tx.conversation.findUnique({
            where: { id: createdOrExisting.id },
            include: {
                request: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        requesterId: true,
                        assignedHelperId: true,
                    },
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profile: {
                                    select: {
                                        fullName: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        return {
            conversation,
            systemMessageCreated: systemMessageResult.created,
            systemMessageId: systemMessageResult.messageId,
        };
    });

    const conversation = conversationResult?.conversation ?? null;
    if (!conversation) {
        throw new AppError("Failed to initialize conversation", 500);
    }

    return {
        ...conversation,
        starterNote: buildStarterNote(conversation.request.status, false),
        systemMessageCreated: conversationResult.systemMessageCreated,
        systemMessageId: conversationResult.systemMessageId,
    };
};

export const createConversation = async (requestId: string, actorUserId?: string) => {
    return ensureConversationForRequest({ requestId, actorUserId });
};

export const getConversationByIdForUser = async (
    conversationId: string,
    userId: string
) => {
    await assertConversationMembership(conversationId, userId);

    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            request: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    requesterId: true,
                    assignedHelperId: true,
                },
            },
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            profile: {
                                select: {
                                    fullName: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                },
            },
            messages: {
                where: { deletedAt: null },
                orderBy: { createdAt: "asc" },
                take: DEFAULT_LIMIT,
                include: {
                    sender: {
                        select: {
                            id: true,
                            email: true,
                            profile: {
                                select: {
                                    fullName: true,
                                    avatarUrl: true,
                                },
                            },
                        },
                    },
                    images: {
                        select: {
                            id: true,
                            url: true,
                            type: true,
                            createdAt: true,
                        },
                    },
                },
            },
        },
    });

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    return {
        ...conversation,
        starterNote: buildStarterNote(conversation.request.status, conversation.messages.length > 0),
    };
};

export const getConversationByRequestIdForUser = async (
    requestId: string,
    userId: string
) => {
    const conversation = await prisma.conversation.findUnique({
        where: { requestId },
        select: { id: true },
    });

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    return getConversationByIdForUser(conversation.id, userId);
};

export const listConversationMessages = async ({
    conversationId,
    userId,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    sort = "asc",
}: ListConversationMessagesInput) => {
    await assertConversationMembership(conversationId, userId);

    const { skip, limit: safeLimit, page: safePage } = sanitizePagination(page, limit);

    const [total, messages] = await Promise.all([
        prisma.message.count({
            where: {
                conversationId,
                deletedAt: null,
            },
        }),
        prisma.message.findMany({
            where: {
                conversationId,
                deletedAt: null,
            },
            orderBy: { createdAt: sort },
            skip,
            take: safeLimit,
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                fullName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                images: {
                    select: {
                        id: true,
                        url: true,
                        type: true,
                        createdAt: true,
                    },
                },
            },
        }),
    ]);

    return {
        messages,
        meta: {
            total,
            page: safePage,
            totalPages: Math.ceil(total / safeLimit),
            limit: safeLimit,
        },
    };
};

export const listUserConversations = async ({
    userId,
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
}: ListUserConversationsInput) => {
    const { skip, page: safePage, limit: safeLimit } = sanitizePagination(page, limit);

    const [total, memberships] = await Promise.all([
        prisma.conversationMember.count({ where: { userId } }),
        prisma.conversationMember.findMany({
            where: { userId },
            skip,
            take: safeLimit,
            orderBy: { createdAt: "desc" },
            include: {
                conversation: {
                    include: {
                        request: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                requesterId: true,
                                assignedHelperId: true,

                            },
                        },
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        email: true,

                                        profile: {
                                            select: {
                                                fullName: true,
                                                avatarUrl: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        messages: {
                            where: { deletedAt: null },
                            orderBy: { createdAt: "desc" },
                            take: 1,
                            include: {
                                sender: {
                                    select: {
                                        id: true,
                                        email: true,
                                        profile: {
                                            select: {
                                                fullName: true,
                                                avatarUrl: true,
                                            },
                                        },
                                    },
                                },
                                images: {
                                    select: {
                                        id: true,
                                        url: true,
                                        type: true,
                                        createdAt: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }),
    ]);

    const conversationIds = memberships.map((membership) => membership.conversationId);

    const unreadCounts = await prisma.message.groupBy({
        by: ["conversationId"],
        where: {
            conversationId: { in: conversationIds },
            deletedAt: null,
            isRead: false,
            senderId: { not: userId },
        },
        _count: {
            _all: true,
        },
    });

    const unreadMap = new Map(
        unreadCounts.map((item) => [item.conversationId, item._count._all])
    );

    return {
        conversations: memberships.map((membership) => {
            const conversation = membership.conversation as ConversationWithMembers & {
                messages: MessageWithSender[];
            };

            const [lastMessage] = conversation.messages;
            const unreadCount = unreadMap.get(conversation.id) ?? 0;

            return formatConversation(
                conversation,
                lastMessage ?? null,
                unreadCount,
                buildStarterNote(conversation.request.status, Boolean(lastMessage))
            );
        }),
        meta: {
            total,
            page: safePage,
            totalPages: Math.ceil(total / safeLimit),
            limit: safeLimit,
        },
    };
};

export const sendConversationMessage = async ({
    conversationId,
    senderId,
    content,
}: SendMessageInput) => {
    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
        throw new AppError("Message content is required", 400);
    }

    if (trimmedContent.length > MESSAGE_MAX_LENGTH) {
        throw new AppError(
            `Message cannot exceed ${MESSAGE_MAX_LENGTH} characters`,
            400
        );
    }

    const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
            request: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                },
            },
            members: {
                select: {
                    userId: true,
                },
            },
        },
    });

    if (!conversation) {
        throw new AppError("Conversation not found", 404);
    }

    const isMember = conversation.members.some((member) => member.userId === senderId);
    if (!isMember) {
        throw new AppError("Forbidden", 403);
    }

    if (conversation.request.status !== RequestStatus.ASSIGNED) {
        throw new AppError("Messages are only allowed while request is ASSIGNED", 400);
    }

    const recipientMember = conversation.members.find(
        (member) => member.userId !== senderId
    );

    if (!recipientMember) {
        throw new AppError("Conversation recipient not found", 400);
    }

    const message = await prisma.$transaction(async (tx) => {
        const created = await tx.message.create({
            data: {
                conversationId,
                senderId,
                content: trimmedContent,
                type: MessageType.TEXT,
                isRead: false,
            },
        });

        await tx.conversation.update({
            where: { id: conversationId },
            data: {
                updatedAt: new Date(),
            },
        });

        return tx.message.findUnique({
            where: { id: created.id },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: {
                                fullName: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                images: {
                    select: {
                        id: true,
                        url: true,
                        type: true,
                        createdAt: true,
                    },
                },
            },
        });
    });

    if (!message) {
        throw new AppError("Failed to send message", 500);
    }

    await createNotification({
        userId: recipientMember.userId,
        actorId: senderId,
        type: NotificationType.MESSAGE_RECEIVED,
        title: "New message",
        body: trimmedContent,
        requestId: conversation.request.id,
        conversationId,
        messageId: message.id,
        data: {
            requestTitle: conversation.request.title,
        },
    });

    return message;
};

export const markConversationMessagesAsRead = async (
    conversationId: string,
    userId: string
) => {
    await assertConversationMembership(conversationId, userId);

    return prisma.message.updateMany({
        where: {
            conversationId,
            deletedAt: null,
            isRead: false,
            senderId: {
                not: userId,
            },
        },
        data: {
            isRead: true,
        },
    });
};

export const softDeleteConversationMessage = async (
    conversationId: string,
    messageId: string,
    userId: string
) => {
    await assertConversationMembership(conversationId, userId);

    const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: {
            id: true,
            conversationId: true,
            senderId: true,
            deletedAt: true,
        },
    });

    if (!message || message.conversationId !== conversationId) {
        throw new AppError("Message not found", 404);
    }

    if (message.senderId !== userId) {
        throw new AppError("Forbidden", 403);
    }

    if (message.deletedAt) {
        return message;
    }

    return prisma.message.update({
        where: { id: messageId },
        data: {
            deletedAt: new Date(),
        },
    });
};
