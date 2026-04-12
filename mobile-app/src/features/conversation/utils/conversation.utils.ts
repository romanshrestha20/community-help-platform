import type { Conversation, ConversationMember, Message } from "../types/conversation.type";

/**
 * Returns the other participant in a conversation (not the current user).
 */
export function getOtherParticipant(conversation: Conversation, userId: string): ConversationMember | undefined {
    return conversation.members.find((m) => m.id !== userId);
}

/**
 * Returns a preview string for the last message (or starter note if no message).
 */
export function getLastMessagePreview(conversation: Conversation, userId: string): string {
    if (conversation.lastMessage) {
        const { content, sender } = conversation.lastMessage;
        if (!content) return "[No content]";
        if (sender.id === userId) return `You: ${content}`;
        return content;
    }
    if (conversation.starterNote) return conversation.starterNote;
    return "No messages yet";
}

/**
 * Type guard for Conversation shape (runtime check).
 */
export function isValidConversation(obj: any): obj is Conversation {
    return (
        obj &&
        typeof obj.id === "string" &&
        Array.isArray(obj.members) &&
        typeof obj.unreadCount === "number" &&
        typeof obj.request === "object" &&
        "id" in obj.request &&
        (obj.lastMessage === null || (typeof obj.lastMessage === "object" && "id" in obj.lastMessage))
    );
}
