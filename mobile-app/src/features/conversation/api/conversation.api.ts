import apiClient from "@/api/api-client";
import type {
  ApiResponse,
  Conversation,
  Message,
  PaginatedMeta,
  PaginatedApiResponse,
} from "../types/conversation.type";

const unwrapResponse = <T>(response: ApiResponse<T>): T => {
  if (!response.success) {
    throw new Error(response.message || "Request failed");
  }

  return response.data;
};

export const ensureConversationApi = async (
  requestId: string
): Promise<Conversation> => {
  const response = await apiClient.post<ApiResponse<Conversation>>(
    `/conversations/request/${requestId}/ensure`
  );
  return unwrapResponse(response.data);
};

export const getMyConversationsApi = async (): Promise<Conversation[]> => {
  const response =
    await apiClient.get<PaginatedApiResponse<Conversation[]>>("/conversations");
  return unwrapResponse(response.data);
};

export const getConversationByRequestIdApi = async (
  requestId: string
): Promise<Conversation> => {
  const response = await apiClient.get<ApiResponse<Conversation>>(
    `/conversations/request/${requestId}`
  );
  return unwrapResponse(response.data);
};

export const getConversationByIdApi = async (
  conversationId: string
): Promise<Conversation> => {
  const response = await apiClient.get<ApiResponse<Conversation>>(
    `/conversations/${conversationId}`
  );
  return unwrapResponse(response.data);
};

export const getConversationMessagesApi = async (
  conversationId: string,
  query: ConversationMessagesQuery = {}
): Promise<PaginatedMessagesResult> => {
  const response = await apiClient.get<PaginatedApiResponse<Message[]>>(
    `/conversations/${conversationId}/messages`,
    {
      params: query,
    }
  );

  return {
    messages: unwrapResponse(response.data),
    meta: response.data.meta,
  };
};

export const postConversationMessageApi = async (
  conversationId: string,
  content: string
): Promise<Message> => {
  const response = await apiClient.post<ApiResponse<Message>>(
    `/conversations/${conversationId}/messages`,
    { content }
  );

  return unwrapResponse(response.data);
};

export const readConversationApi = async (
  conversationId: string
): Promise<void> => {
  const response = await apiClient.patch<ApiResponse<null>>(
    `/conversations/${conversationId}/read`
  );
  unwrapResponse(response.data);
};

export const removeConversationMessageApi = async (
  conversationId: string,
  messageId: string
): Promise<void> => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/conversations/${conversationId}/messages/${messageId}`
  );
  unwrapResponse(response.data);
};
export type ConversationMessagesQuery = {
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
};

export type PaginatedMessagesResult = {
  messages: Message[];
  meta: PaginatedMeta;
};
