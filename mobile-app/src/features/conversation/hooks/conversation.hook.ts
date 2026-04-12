import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/features/auth/store/auth.store";
import type { Conversation, Message } from "../types/conversation.type";
import {
    deleteConversationMessage,
    ensureConversation,
    getConversationById,
    getConversationByRequestId,
    getConversationMessages,
    getMyConversations,
    markConversationAsRead,
    sendConversationMessage,
} from "../services/conversation.service";

const CONVERSATIONS_POLL_INTERVAL_MS = 15000;
const THREAD_POLL_INTERVAL_MS = 5000;

const sortByCreatedAtAsc = (messages: Message[]) => {
    return [...messages].sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
};

const getErrorMessage = (caughtError: unknown, fallback: string) => {
    return caughtError instanceof Error ? caughtError.message : fallback;
};

const isConversationNotFoundError = (caughtError: unknown) => {
    if (!caughtError || typeof caughtError !== "object") {
        return false;
    }

    const error = caughtError as {
        response?: { status?: number; data?: { message?: string } };
        status?: number;
        message?: string;
    };

    return (
        error.response?.status === 404 ||
        error.status === 404 ||
        error.message === "Conversation not found" ||
        error.response?.data?.message === "Conversation not found"
    );
};

export const useConversations = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadConversations = useCallback(async () => {
        setError(null);
        const result = await getMyConversations();
        setConversations(result);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);

            try {
                if (isMounted) {
                    await loadConversations();
                }
            } catch (caughtError) {
                if (isMounted) {
                    setError(getErrorMessage(caughtError, "Could not load conversations"));
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            isMounted = false;
        };
    }, [loadConversations]);

    useEffect(() => {
        let isActive = true;

        const syncConversations = async () => {
            if (!isActive) {
                return;
            }

            try {
                await loadConversations();
            } catch (caughtError) {
                if (isActive) {
                    setError(getErrorMessage(caughtError, "Could not refresh conversations"));
                }
            }
        };

        const intervalId = setInterval(() => {
            void syncConversations();
        }, CONVERSATIONS_POLL_INTERVAL_MS);

        const appStateSubscription = AppState.addEventListener("change", (nextState) => {
            if (nextState === "active") {
                void syncConversations();
            }
        });

        return () => {
            isActive = false;
            clearInterval(intervalId);
            appStateSubscription.remove();
        };
    }, [loadConversations]);

    const reload = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadConversations();
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Could not refresh conversations"));
        } finally {
            setRefreshing(false);
        }
    }, [loadConversations]);

    return {
        conversations,
        loading,
        refreshing,
        error,
        reload,
    };
};

type UseConversationThreadOptions = {
    conversationId?: string;
    requestId?: string;
    autoMarkRead?: boolean;
};

export const useConversationThread = (
    options: UseConversationThreadOptions = {}
) => {
    const {
        conversationId,
        requestId,
        autoMarkRead = true,
    } = options;

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sending, setSending] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const activeUserId = useAuthStore((state) => state.user?.id ?? "");

    const resolvedConversationId = useMemo(
        () => conversation?.id ?? conversationId ?? null,
        [conversation?.id, conversationId]
    );

    const loadThread = useCallback(async (options: { preserveError?: boolean } = {}) => {
        const { preserveError = false } = options;

        if (!preserveError) {
            setError(null);
        }

        if (!conversationId && !requestId) {
            setConversation(null);
            setMessages([]);
            return;
        }

        let activeConversation: Conversation | null = null;

        if (conversationId) {
            activeConversation = await getConversationById(conversationId);
        } else if (requestId) {
            try {
                activeConversation = await getConversationByRequestId(requestId);
            } catch (caughtError) {
                if (!isConversationNotFoundError(caughtError)) {
                    throw caughtError;
                }
            }
        }

        if (!activeConversation && requestId) {
            activeConversation = await ensureConversation(requestId);
        }

        if (!activeConversation) {
            throw new Error("Conversation not found");
        }

        setConversation(activeConversation);

        const loadedMessages = await getConversationMessages(activeConversation.id);
        const sortedMessages = sortByCreatedAtAsc(loadedMessages);
        const hasUnreadIncoming = autoMarkRead
            ? sortedMessages.some(
                (message) => !message.isRead && message.senderId !== activeUserId
            )
            : false;

        if (hasUnreadIncoming) {
            await markConversationAsRead(activeConversation.id);
        }

        setMessages(
            hasUnreadIncoming
                ? sortedMessages.map((message) => ({
                    ...message,
                    isRead: message.senderId === activeUserId ? message.isRead : true,
                }))
                : sortedMessages
        );
    }, [activeUserId, autoMarkRead, conversationId, requestId]);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            setLoading(true);

            try {
                if (isMounted) {
                    await loadThread();
                }
            } catch (caughtError) {
                if (isMounted) {
                    setError(getErrorMessage(caughtError, "Could not load conversation"));
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            isMounted = false;
        };
    }, [loadThread]);

    useEffect(() => {
        let isActive = true;

        if (!resolvedConversationId) {
            return () => {
                isActive = false;
            };
        }

        const syncThread = async () => {
            if (!isActive) {
                return;
            }

            try {
                await loadThread({ preserveError: true });
            } catch (caughtError) {
                if (isActive) {
                    setError(getErrorMessage(caughtError, "Could not refresh conversation"));
                }
            }
        };

        const intervalId = setInterval(() => {
            void syncThread();
        }, THREAD_POLL_INTERVAL_MS);

        const appStateSubscription = AppState.addEventListener("change", (nextState) => {
            if (nextState === "active") {
                void syncThread();
            }
        });

        return () => {
            isActive = false;
            clearInterval(intervalId);
            appStateSubscription.remove();
        };
    }, [loadThread, resolvedConversationId]);

    const reload = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadThread();
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Could not refresh conversation"));
        } finally {
            setRefreshing(false);
        }
    }, [loadThread]);

    const sendMessage = useCallback(async (content: string) => {
        const activeConversationId = resolvedConversationId;
        if (!activeConversationId) {
            throw new Error("Conversation is not ready");
        }

        setSending(true);
        setError(null);

        try {
            const message = await sendConversationMessage(activeConversationId, content);
            setMessages((current) => sortByCreatedAtAsc([...current, message]));
            return message;
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Could not send message"));
            throw caughtError;
        } finally {
            setSending(false);
        }
    }, [resolvedConversationId]);

    const markRead = useCallback(async () => {
        const activeConversationId = resolvedConversationId;
        if (!activeConversationId) {
            return;
        }

        try {
            await markConversationAsRead(activeConversationId);
            setMessages((current) =>
                current.map((message) => ({
                    ...message,
                    isRead: true,
                }))
            );
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Could not mark conversation as read"));
        }
    }, [resolvedConversationId]);

    const deleteMessage = useCallback(async (messageId: string) => {
        const activeConversationId = resolvedConversationId;
        if (!activeConversationId) {
            throw new Error("Conversation is not ready");
        }

        setDeletingMessageId(messageId);
        setError(null);

        try {
            await deleteConversationMessage(activeConversationId, messageId);
            setMessages((current) =>
                current.map((message) =>
                    message.id === messageId
                        ? {
                            ...message,
                            deletedAt: new Date().toISOString(),
                            content: "",
                        }
                        : message
                )
            );
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Could not delete message"));
            throw caughtError;
        } finally {
            setDeletingMessageId(null);
        }
    }, [resolvedConversationId]);

    return {
        conversation,
        messages,
        loading,
        refreshing,
        sending,
        deletingMessageId,
        error,
        reload,
        sendMessage,
        markRead,
        deleteMessage,
        resolvedConversationId,
    };
};
