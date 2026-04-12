export type ConversationRequestStatus =
  | "OPEN"
  | "ASSIGNED"
  | "COMPLETED"
  | "CANCELLED";

export type ConversationMember = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  joinedAt: string;
};

export type MessageSender = {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export type MessageImage = {
  id: string;
  url: string;
  type: string;
  createdAt: string;
};

export type ConversationLastMessage = {
  id: string;
  content: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
  sender: MessageSender;
  images: MessageImage[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  sender: MessageSender;
  images: MessageImage[];
};

export type Conversation = {
  id: string;
  request: {
    id: string;
    title: string;
    status: ConversationRequestStatus;
    requesterId: string;
    assignedHelperId: string | null;
  };
  members: ConversationMember[];
  lastMessage: ConversationLastMessage | null;
  unreadCount: number;
  starterNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export type PaginatedMeta = {
  total: number;
  page: number;
  totalPages: number;
  limit: number;
};

export type PaginatedApiResponse<T> = ApiResponse<T> & {
  meta: PaginatedMeta;
};