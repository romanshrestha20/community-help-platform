import { useAsync } from "@/utils/useAsync";
import { useCallback } from "react";
import * as helpRequestService from "../services/helpRequest.service";
import {
    CreateHelpRequestData,
    HelpRequestStatus,
    RequestImageUploadInput,
    UpdateHelpRequestData,
} from "../types/helpRequest.types";


export const useHelpRequest = () => {
    const { loading, error, run } = useAsync();

    const createHelpRequest = useCallback((data: CreateHelpRequestData, images: RequestImageUploadInput[] = []) => {
        return run(() => helpRequestService.createHelpRequest(data, images));
    }, [run]);

    const addHelpRequestImages = useCallback((requestId: string, images: RequestImageUploadInput[]) => {
        return run(() => helpRequestService.addHelpRequestImages(requestId, images));
    }, [run]);

    const getHelpRequestById = useCallback((id: string) => {
        return run(() => helpRequestService.getHelpRequestById(id));
    }, [run]);

    const getMyHelpRequests = useCallback((params?: Record<string, any>) => {
        return run(() => helpRequestService.getAllHelpRequests(params));
    }, [run]);

    const getNearbyHelpRequests = useCallback((params?: Record<string, any>) => {
        return run(() => helpRequestService.getNearbyHelpRequests(params));
    }, [run]);

    const updateHelpRequest = useCallback((id: string, data: UpdateHelpRequestData) => {
        return run(() => helpRequestService.updateHelpRequest(id, data));
    }, [run]);

    const updateHelpRequestStatus = useCallback((id: string, status: HelpRequestStatus) => {
        return run(() => helpRequestService.updateHelpRequestStatus(id, status));
    }, [run]);

    const deleteHelpRequest = useCallback((id: string) => {
        return run(() => helpRequestService.deleteHelpRequest(id));
    }, [run]);

    return {
        loading,
        error,
        createHelpRequest,
        addHelpRequestImages,
        getHelpRequestById,
        getMyHelpRequests,
        getNearbyHelpRequests,
        updateHelpRequest,
        updateHelpRequestStatus,
        deleteHelpRequest
    };
}
