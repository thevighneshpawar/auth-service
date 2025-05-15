import { Request } from 'express'

export interface userData {
    firstName: string
    lastName: string
    email: string
    password: string
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
