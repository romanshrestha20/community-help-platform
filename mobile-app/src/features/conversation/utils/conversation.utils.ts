import type { Conversation, ConversationMember } from "../types/conversation.type";

/**
 * Returns the other participant in a conversation (not the current user).
 */
export function getOtherParticipant(
    conversation: Conversation,
    userId: string,
    userEmail?: string
): ConversationMember | undefined {
    const members = conversation.members ?? [];

    if (members.length === 0) {
        return undefined;
    }

    const byIdentity = members.find((member) => {
        if (userId && member.id === userId) {
            return false;
        }

        if (userEmail && member.email === userEmail) {
            return false;
        }

        return true;
    });

    if (byIdentity) {
        return byIdentity;
    }

    const assignedHelper = conversation.request.assignedHelperId
        ? members.find((member) => member.id === conversation.request.assignedHelperId)
        : undefined;

    return assignedHelper ?? members.find((member) => member.id === conversation.request.requesterId) ?? members[0];
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

    switch (conversation.request.status) {
        case "ASSIGNED":
            return "Chat is ready for handoff details and updates.";
        case "COMPLETED":
            return "This request is complete. Conversation remains for reference.";
        case "CANCELLED":
            return "This request was cancelled. Conversation is closed.";
        default:
            return "Conversation opens once a helper is assigned.";
    }
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
