import type { Response } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: {
        email: string;
        password: string;
    }, response: Response): Promise<{
        message: string;
        user: any;
    }>;
    register(req: {
        email: string;
        password: string;
        username?: string;
    }): Promise<import("../users/user.entity").User>;
    logout(response: Response): Promise<{
        message: string;
    }>;
}
