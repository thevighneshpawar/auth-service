import { Request } from 'express'

export interface userData {
    firstName: string
    lastName: string
    email: string
    password: string
    role: string
}

export interface RegisterUserRequest extends Request {
    body: userData
}
export interface AuthRequest extends Request {
    auth: {
        sub: string
        role: string
        id?: string
        tenant: string
        firstName: string
        lastName: string
        email: string
    }
}
export type AuthCookie = {
    accessToken: string
    refreshToken: string
}

export interface irefreshTokenPayload {
    id: string
}

export interface Itenant {
    name: string
    address: string
}

export interface CreateTenantRequest extends Request {
    body: Itenant
}

export interface TenantQueryParams {
    q: string
    perPage: number
    currentPage: number
}

export interface CreateUserRequest extends Request {
    body: userData
}
