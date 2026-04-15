import { Request, Response, NextFunction } from "express";
import { vi } from "vitest";

type ReqShape = {
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    query?: Record<string, unknown>;
    headers?: Record<string, string>;
    user?: Record<string, unknown>;
    ip?: string;
};

export const makeReq = (shape: ReqShape = {}): Request => {
    return {
        body: shape.body ?? {},
        params: shape.params ?? {},
        query: shape.query ?? {},
        headers: shape.headers ?? {},
        user: shape.user,
        ip: shape.ip ?? "127.0.0.1",
        socket: { remoteAddress: shape.ip ?? "127.0.0.1" },
    } as unknown as Request;
};

export const makeRes = (): Response => {
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };

    return res as unknown as Response;
};

export const makeNext = (): NextFunction => vi.fn() as unknown as NextFunction;
