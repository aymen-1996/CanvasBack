/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Body, Param, Delete, BadRequestException, Res, NotFoundException, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { user } from 'src/user/user.entity';
import { EmailService } from 'src/user/email/email.service';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService  ,@InjectRepository(user) private readonly userRep:Repository<user>,private readonly userService:UserService ,private jwtService:JwtService ,private emailService:EmailService) {}



  @Post('login')
  async login(
      @Body('emailUser') email:string,
      @Body('passwordUser') password:string,
      @Res({passthrough:true}) response:Response
  ){
      const user=await this.userService.findOneByEmail(email);
      if (!user) {
        return { user: null, message: 'Email not found!', success: false, token: '' };
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordUser);

      if (!isPasswordValid) {
        return { user: null, message: 'Incorrect password!', success: false, token: '' };
      }

      const jwt =await this.jwtService.signAsync({id:user.idUser});

      response.cookie('jwt',jwt,{httpOnly:true});

      return ({jwt,user});
  }


//envoyer lien
  @Post('request')
  async requestPasswordReset(@Body() { email }: { email: string }) {
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
        throw new NotFoundException('Utilisateur non trouvé. Créez un compte avec cette adresse e-mail.');
    }

    const token = await this.generateResetToken(user);

    const resetLink = `http://localhost:4200/reset-password/${token}`;

     this.emailService.sendEmail(
      email,
      'Réinitialisation de mot de passe',
      `Pour réinitialiser votre mot de passe, cliquez sur le lien suivant : http://localhost:4200/reset-password/${token}. Le lien expire dans 10 minutes.`,
      );

    return { message: 'Email envoyé pour la réinitialisation du mot de passe'};
  }

  //Generate token and save in class user 
  async generateResetToken(user: user): Promise<string> {
    const token = uuidv4();
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 10);

    user.resetToken = token;
    user.resetTokenExpiration = expirationDate;

    await this.userRep.save(user);

    return token;
  }

 
  // Pour que si resttoken n est pas valide ,nouveau lien envoyer a user
  @Post('validate-reset-token/:resetToken')
  async validateResetToken(@Param('resetToken') resetToken: string) {
    try {
      const user = await this.userService.findOne({ resetToken });
  
      if (!user || (user.resetTokenExpiration && user.resetTokenExpiration < new Date())) {
        const newToken = await this.generateResetToken(user);
        this.emailService.sendEmail(
            user.emailUser,
            'Réinitialisation de mot de passe',
            `Pour réinitialiser votre mot de passe, cliquez sur le lien suivant : http://localhost:4200/reset-password/${newToken}. Le lien expire dans 10 minutes.`,
          );
            
          return { message: 'Email envoyé pour la réinitialisation du mot de passe' };          
      }

    } catch (error) {
      console.error('Error in validateResetToken:', error.message);
      return { message: 'An error occurred while processing the reset token' };
    }
  }


  //verfication token
  @Get('verify-token/:token')
  async verifyToken(@Param('token') token: string): Promise<{ isValid: boolean }> {
    try {
      const decoded = this.jwtService.verify(token);

      return { isValid: true };
    } catch (error) {
      return { isValid: false };
    }
  }
  //Api logout // localhost:3000/auth/logout
  @Post('logout')
  async logout(@Req() request: any) {
      if (request.session) {
          request.session.destroy(); 
      }
      return { message: 'Déconnexion réussie' };
  }
}


