import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
    addSocketListener,
    connectSocket,
    joinConversationRoom,
    leaveConversationRoom,
    markSocketConversationRead,
    sendSocketMessage,
    startSocketTyping,
    stopSocketTyping,
    type SocketMessageReadEvent,
    type SocketTypingEvent,
} from "@/lib/socket-client";
import type { Conversation, Message } from "../types/conversation.type";
import {
    deleteConversationMessage,
    getConversationById,
    getConversationByRequestId,
    getConversationMessages,
    getMyConversations,
    markConversationAsRead,
    sendConversationMessage,
} from "../services/conversation.service";

const CONVERSATIONS_POLL_INTERVAL_MS = 15000;
const THREAD_POLL_INTERVAL_MS = 5000;
const THREAD_PAGE_SIZE = 20;

const sortByCreatedAtAsc = (messages: Message[]) => {
    return [...messages].sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
};

const mergeMessages = (current: Message[], incoming: Message[]) => {
    const merged = new Map<string, Message>();

    for (const message of current) {
        merged.set(message.id, message);
    }

    for (const message of incoming) {
        merged.set(message.id, message);
    }

    return sortByCreatedAtAsc(Array.from(merged.values()));
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
    const joinedConversationIdsRef = useRef<Set<string>>(new Set());

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
        const cleanupFns: Array<() => void> = [];

        const bindSocket = async () => {
            try {
                await connectSocket();

                for (const conversation of conversations) {
                    if (joinedConversationIdsRef.current.has(conversation.id)) {
                        continue;
                    }

                    await joinConversationRoom(conversation.id);
                    joinedConversationIdsRef.current.add(conversation.id);
                }

                cleanupFns.push(
                    addSocketListener<{ conversationId: string }>("message:new", ({ conversationId }) => {
                        if (!isActive || !joinedConversationIdsRef.current.has(conversationId)) {
                            return;
                        }

                        void loadConversations().catch((caughtError) => {
                            if (isActive) {
                                setError(getErrorMessage(caughtError, "Could not refresh conversations"));
                            }
                        });
                    }),
                    addSocketListener<SocketMessageReadEvent>("message:read", ({ conversationId }) => {
                        if (!isActive || !joinedConversationIdsRef.current.has(conversationId)) {
                            return;
                        }

                        void loadConversations().catch((caughtError) => {
                            if (isActive) {
                                setError(getErrorMessage(caughtError, "Could not refresh conversations"));
                            }
                        });
                    })
                );
            } catch (caughtError) {
                if (isActive) {
                    setError(getErrorMessage(caughtError, "Could not connect live inbox updates"));
                }
            }
        };

        void bindSocket();

        return () => {
            isActive = false;
            cleanupFns.forEach((cleanup) => cleanup());
        };
    }, [conversations, loadConversations]);

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
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasOlderMessages, setHasOlderMessages] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [liveWarning, setLiveWarning] = useState<string | null>(null);
    const activeUserId = useAuthStore((state) => state.user?.id ?? "");
    const [nextOlderPage, setNextOlderPage] = useState<number | null>(null);
    const [typingUserId, setTypingUserId] = useState<string | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);

    const resolvedConversationId = useMemo(
        () => conversation?.id ?? conversationId ?? null,
        [conversation?.id, conversationId]
    );

    const loadThread = useCallback(async (options: { preserveError?: boolean; mergeIntoCurrent?: boolean } = {}) => {
        const { preserveError = false, mergeIntoCurrent = false } = options;

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

        if (!activeConversation) {
            setConversation(null);
            setMessages([]);
            setHasOlderMessages(false);
            setNextOlderPage(null);
            return;
        }

        setConversation(activeConversation);

        const latestPage = await getConversationMessages(activeConversation.id, {
            page: 1,
            limit: THREAD_PAGE_SIZE,
            sort: "desc",
        });
        const sortedMessages = latestPage.messages;
        const hasUnreadIncoming = autoMarkRead
            ? sortedMessages.some(
                (message) => !message.isRead && message.senderId !== activeUserId
            )
            : false;

        if (hasUnreadIncoming) {
            await markConversationAsRead(activeConversation.id);
        }

        const normalizedMessages = hasUnreadIncoming
            ? sortedMessages.map((message) => ({
                ...message,
                isRead: message.senderId === activeUserId ? message.isRead : true,
            }))
            : sortedMessages;

        setMessages((current) =>
            mergeIntoCurrent ? mergeMessages(current, normalizedMessages) : normalizedMessages
        );
        setHasOlderMessages((current) =>
            mergeIntoCurrent ? current || latestPage.meta.totalPages > 1 : latestPage.meta.totalPages > 1
        );
        setNextOlderPage((current) => {
            if (mergeIntoCurrent) {
                return current ?? (latestPage.meta.totalPages > 1 ? 2 : null);
            }

            return latestPage.meta.totalPages > 1 ? 2 : null;
        });
    }, [activeUserId, autoMarkRead, conversationId, requestId]);

    useEffect(() => {
        let isActive = true;
        const activeConversationId = resolvedConversationId;

        if (!activeConversationId) {
            return () => {
                isActive = false;
            };
        }

        const bindSocket = async () => {
            try {
                const socket = await connectSocket();
                setLiveWarning(null);
                const handleConnect = () => {
                    setLiveWarning(null);
                };
                const handleConnectError = () => {
                    setLiveWarning("Live updates unavailable");
                };

                socket.on("connect", handleConnect);
                socket.on("connect_error", handleConnectError);
                cleanupFns.push(() => {
                    socket.off("connect", handleConnect);
                    socket.off("connect_error", handleConnectError);
                });

                await joinConversationRoom(activeConversationId);

                const removeNewMessageListener = addSocketListener<{
                    conversationId: string;
                    message: Message;
                }>("message:new", ({ conversationId: incomingConversationId, message }) => {
                    if (!isActive || incomingConversationId !== activeConversationId) {
                        return;
                    }

                    setMessages((current) => mergeMessages(current, [message]));
                });

                const removeReadListener = addSocketListener<SocketMessageReadEvent>(
                    "message:read",
                    ({ conversationId: incomingConversationId, userId }) => {
                        if (!isActive || incomingConversationId !== activeConversationId || userId === activeUserId) {
                            return;
                        }

                        setMessages((current) =>
                            current.map((message) =>
                                message.senderId === activeUserId
                                    ? { ...message, isRead: true }
                                    : message
                            )
                        );
                    }
                );

                const removeTypingStartListener = addSocketListener<SocketTypingEvent>(
                    "typing:start",
                    ({ conversationId: incomingConversationId, userId }) => {
                        if (!isActive || incomingConversationId !== activeConversationId || userId === activeUserId) {
                            return;
                        }

                        setTypingUserId(userId);
                    }
                );

                const removeTypingStopListener = addSocketListener<SocketTypingEvent>(
                    "typing:stop",
                    ({ conversationId: incomingConversationId, userId }) => {
                        if (!isActive || incomingConversationId !== activeConversationId || userId === activeUserId) {
                            return;
                        }

                        setTypingUserId((current) => (current === userId ? null : current));
                    }
                );

                cleanupFns.push(
                    removeNewMessageListener,
                    removeReadListener,
                    removeTypingStartListener,
                    removeTypingStopListener
                );
            } catch (caughtError) {
                if (isActive) {
                    console.warn("Live conversation socket unavailable:", caughtError);
                    setLiveWarning("Live updates unavailable");
                }
            }
        };

        const cleanupFns: Array<() => void> = [];

        void bindSocket();

        return () => {
            isActive = false;
            setTypingUserId(null);
            setLiveWarning(null);
            isTypingRef.current = false;
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
            cleanupFns.forEach((cleanup) => cleanup());
            void leaveConversationRoom(activeConversationId).catch(() => undefined);
        };
    }, [activeUserId, resolvedConversationId]);

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
                await loadThread({ preserveError: true, mergeIntoCurrent: true });
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

    const loadOlderMessages = useCallback(async () => {
        const activeConversationId = resolvedConversationId;
        const page = nextOlderPage;

        if (!activeConversationId || !page || loadingOlder || !hasOlderMessages) {
            return;
        }

        setLoadingOlder(true);

        try {
            const result = await getConversationMessages(activeConversationId, {
                page,
                limit: THREAD_PAGE_SIZE,
                sort: "desc",
            });

            setMessages((current) => mergeMessages(result.messages, current));
            setHasOlderMessages(result.meta.totalPages > page);
            setNextOlderPage(result.meta.totalPages > page ? page + 1 : null);
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Could not load older messages"));
        } finally {
            setLoadingOlder(false);
        }
    }, [hasOlderMessages, loadingOlder, nextOlderPage, resolvedConversationId]);

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

    const notifyTypingActivity = useCallback(() => {
        const activeConversationId = resolvedConversationId;

        if (!activeConversationId) {
            return;
        }

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            void startSocketTyping(activeConversationId).catch(() => undefined);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            typingTimeoutRef.current = null;
            void stopSocketTyping(activeConversationId).catch(() => undefined);
        }, 1500);
    }, [resolvedConversationId]);

    const stopTyping = useCallback(() => {
        const activeConversationId = resolvedConversationId;

        if (!activeConversationId || !isTypingRef.current) {
            return;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        isTypingRef.current = false;
        void stopSocketTyping(activeConversationId).catch(() => undefined);
    }, [resolvedConversationId]);

    const sendMessage = useCallback(async (content: string) => {
        const activeConversationId = resolvedConversationId;
        if (!activeConversationId) {
            throw new Error("Conversation is not ready");
        }

        setSending(true);
        setError(null);

        try {
            stopTyping();
            let message: Message;

            try {
                message = await sendSocketMessage<Message>(activeConversationId, content);
            } catch {
                message = await sendConversationMessage(activeConversationId, content);
            }

            setMessages((current) => mergeMessages(current, [message]));
            return message;
        } catch (caughtError) {
            setError(getErrorMessage(caughtError, "Could not send message"));
            throw caughtError;
        } finally {
            setSending(false);
        }
    }, [resolvedConversationId, stopTyping]);

    const markRead = useCallback(async () => {
        const activeConversationId = resolvedConversationId;
        if (!activeConversationId) {
            return;
        }

        try {
            try {
                await markSocketConversationRead(activeConversationId);
            } catch {
                await markConversationAsRead(activeConversationId);
            }

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
        loadingOlder,
        hasOlderMessages,
        error,
        reload,
        loadOlderMessages,
        sendMessage,
        markRead,
        deleteMessage,
        resolvedConversationId,
        liveWarning,
        typingUserId,
        notifyTypingActivity,
        stopTyping,
    };
};
