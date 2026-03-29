import apiClient from "@/api/api-client";
import { CreateBidData, RespondBidData, UpdateBidData } from "../types/bid.types";



export const createBidApi = (data: CreateBidData) =>
    apiClient.post("/bids", data);

export const getBidsByHelpRequestIdApi = (helpRequestId: string) =>
    apiClient.get(`/bids/help-request/${helpRequestId}`);

export const updateBidApi = (bidId: string, data: Partial<UpdateBidData>) =>
    apiClient.put(`/bids/${bidId}`, data);

export const respondToBidApi = (bidId: string, data: RespondBidData) =>
    apiClient.patch(`/bids/${bidId}/respond`, data);


export const deleteBidApi = (bidId: string) =>
    apiClient.delete(`/bids/${bidId}`);

export const getBidByIdApi = (bidId: string) =>
    apiClient.get(`/bids/${bidId}`);