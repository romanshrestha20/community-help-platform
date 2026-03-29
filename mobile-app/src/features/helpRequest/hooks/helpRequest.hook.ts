import { useAsync } from "@/utils/useAsync";
import { useCallback } from "react";
import * as helpRequestService from "../services/helpRequest.service";
import { CreateHelpRequestData, HelpRequestStatus, UpdateHelpRequestData } from "../types/helpRequest.types";


export const useHelpRequest = () => {
    const { loading, error, run } = useAsync();

    const createHelpRequest = useCallback((data: CreateHelpRequestData) => {
        return run(() => helpRequestService.createHelpRequest(data));
    }, [run]);

    const getHelpRequestById = useCallback((id: string) => {
        return run(() => helpRequestService.getHelpRequestById(id));
    }, [run]);

    const getMyHelpRequests = useCallback((params?: Record<string, any>) => {
        return run(() => helpRequestService.getAllHelpRequests(params));
    }, [run]);

    const updateHelpRequest = useCallback((id: string, data: UpdateHelpRequestData) => {
        return run(() => helpRequestService.updateHelpRequest(id, data));
    }, [run]);

    const updateHelpRequestStatus = useCallback((id: string, status: HelpRequestStatus) => {
        return run(() => helpRequestService.updateHelpRequest(id, { status }));
    }, [run]);

    const deleteHelpRequest = useCallback((id: string) => {
        return run(() => helpRequestService.deleteHelpRequest(id));
    }, [run]);

    return {
        loading,
        error,
        createHelpRequest,
        getHelpRequestById,
        getMyHelpRequests,
        updateHelpRequest,
        updateHelpRequestStatus,
        deleteHelpRequest
    };
}