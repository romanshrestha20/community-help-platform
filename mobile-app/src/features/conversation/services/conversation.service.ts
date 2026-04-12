import {
    type ConversationMessagesQuery,
    type PaginatedMessagesResult,
    ensureConversationApi,
    getMyConversationsApi,
    getConversationByRequestIdApi,
    getConversationByIdApi,
    getConversationMessagesApi,
    postConversationMessageApi,
    readConversationApi,
    removeConversationMessageApi,
} from "../api/conversation.api";
import type { Conversation, Message } from "../types/conversation.type";

/**
 * Ensures a conversation exists for a request (returns existing or creates new).
 */
export async function ensureConversation(requestId: string): Promise<Conversation> {
    return ensureConversationApi(requestId);
}

/**
 * Returns all conversations, sorted by most recently updated.
 */
export async function getMyConversations(): Promise<Conversation[]> {
    const conversations = await getMyConversationsApi();
    return conversations.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Returns a conversation by request ID.
 */
export async function getConversationByRequestId(requestId: string): Promise<Conversation> {
    return getConversationByRequestIdApi(requestId);
}

/**
 * Returns a conversation by conversation ID.
 */
export async function getConversationById(conversationId: string): Promise<Conversation> {
    return getConversationByIdApi(conversationId);
}

/**
 * Returns all messages for a conversation, sorted oldest to newest.
 */
export async function getConversationMessages(
    conversationId: string,
    query: ConversationMessagesQuery = {}
): Promise<PaginatedMessagesResult> {
    const result = await getConversationMessagesApi(conversationId, query);

    return {
        messages: result.messages.slice().sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
        meta: result.meta,
    };
}

/**
 * Sends a message in a conversation.
 */
export async function sendConversationMessage(conversationId: string, content: string): Promise<Message> {
    return postConversationMessageApi(conversationId, content);
}

/**
 * Marks all messages in a conversation as read for the current user.
 */
export async function markConversationAsRead(conversationId: string): Promise<void> {
    await readConversationApi(conversationId);
}

/**
 * Soft-deletes a message from a conversation.
 */
export async function deleteConversationMessage(conversationId: string, messageId: string): Promise<void> {
    await removeConversationMessageApi(conversationId, messageId);
}
