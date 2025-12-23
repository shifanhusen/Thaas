import { Controller, Request, Post, UseGuards, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() req, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.validateUser(req.email, req.password);
    if (!user) {
        throw new Error('Invalid credentials');
    }
    const { access_token } = await this.authService.login(user);
    
    response.cookie('jwt', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 hour
    });

    return { message: 'Login successful', user };
  }

  @Post('register')
  async register(@Body() req) {
    return this.authService.register(req);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
      response.clearCookie('jwt');
      return { message: 'Logout successful' };
  }
}
