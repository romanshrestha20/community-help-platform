type ExpoPushMessage = {
    to: string;
    title: string;
    body: string;
    sound?: "default" | null;
    badge?: number;
    priority?: "default" | "normal" | "high";
    data?: Record<string, unknown>;
};

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const MAX_BATCH_SIZE = 100;

const chunkMessages = <T>(items: T[], size: number) => {
    const chunks: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }

    return chunks;
};

export const sendExpoPushMessages = async (messages: ExpoPushMessage[]) => {
    if (messages.length === 0) {
        return [];
    }

    const responses = await Promise.all(
        chunkMessages(messages, MAX_BATCH_SIZE).map(async (chunk) => {
            const response = await fetch(EXPO_PUSH_ENDPOINT, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(chunk),
            });

            const body = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    `Expo push send failed with status ${response.status}${body ? `: ${JSON.stringify(body)}` : ""}`
                );
            }

            return body;
        })
    );

    return responses;
};

export type { ExpoPushMessage };