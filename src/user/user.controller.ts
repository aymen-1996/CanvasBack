/* eslint-disable prettier/prettier */
import { BadRequestException, Body, Controller, Get, HttpStatus, InternalServerErrorException, NotFoundException, Param, Patch, Post, Put, Req, Res, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { error } from 'console';
import { diskStorage } from 'multer';
import { Observable, of, retry } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { Response ,Request} from 'express';

import * as path from 'path';
import * as fs from 'fs';
import { AuthGuard } from '@nestjs/passport';
import { user } from './user.entity';
import { updateUserDto } from './DTO/updateUser.dto';

@Controller('user')
export class UserController {


    constructor(private readonly userService:UserService ,private jwtService:JwtService){}
   
    // @Post ('uploadphoto')
    // @UseInterceptors(FileInterceptor('file',{
    //     storage:diskStorage({
    //         destination:'./uploads-photos',
    //         filename:(req,file,cb)=>{
    //             const name=file.originalname.split('.')[0];
    //             const fileExtension=file.originalname.split('.')[1];
    //             const newfilename=name.split(" ").join('_')+'_'+Date.now()+'.'+fileExtension;

    //             cb(null ,newfilename);
    //         }
    //     }),
    //     fileFilter:(req, file ,cb)=>{
    //         if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)){
    //             return cb(null,false);
    //         }
    //         cb(null,true);

    //     }
    // }))
    // uploadPhoto(@UploadedFile() file:Express.Multer.File):Observable<Object>{
    //         return of({imagePath:file.path})
    // }



    @Get('/:iduser/photo')
    async getImage(@Param('iduser') userId : number , @Res() res: Response){
        const user = await this.userService.findOneById(userId);

        if (user && user.imageUser){
            const filename=user.imageUser;
            const imagePath=path.join(__dirname, '..', '..', 'upload-photos', filename);

            const exists = require('fs').existsSync(imagePath);
            if (exists) {
                res.sendFile(imagePath);
              } else {
                throw new NotFoundException('Image not found');
              }
            
        } else {
            throw new NotFoundException('User not found');
          }
    }


    //create 
   @Post('signup')
    async register(@Body() body ){
        
        const user = await this.userService.create({       
            ...body
        })
        return user

    }

  

    //getuser 
@Get(':iduser/user')
async getUser(@Param('iduser')iduser :number, @Req() request:Request){
   try{ 

   
    const user= await this.userService.findOne(iduser)

    return user;
}catch(e){
    throw new UnauthorizedException();
}


   
}

    //updateusser


    //requestrest
    @Post('request-password-reset')
    async requestPasswordReset(@Body('email') email: string): Promise<{ message: string }> {
      try {
        await this.userService.requestPasswordReset(email);
        return { message: 'Code reset password sendsuccessful. Please check your email .' };
      } catch (error) {
        console.error(error);
        throw new InternalServerErrorException({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'An internal server error occurred',
        });
      }
    }
    //changepassowrd 
    @Put('/:idUser/changepaswword')
    async changePassword(
        @Param('idUser') iduser:number,
        @Body() body:{ oldpwd:string , newpwd:string ,comfpwd:string}
    ){
        const user=await this.userService.findOneById(iduser);
        if (!user) {
            return { message: 'User not found' };
          }
      
          const isOldPasswordCorrect = await bcrypt.compare(
            body.oldpwd,
            user.passwordUser,
          );
      
          if (!isOldPasswordCorrect) {
            return { message: 'Incorrect old password' };
          }
      
          if (body.newpwd !== body.comfpwd) {
            return { message: 'New password and confirm password do not match' };
          }
      
          const hashedPassword = await bcrypt.hash(
            body.newpwd,
            12,
          );
      
          try {
            await this.userService.updatePassword(user.idUser, hashedPassword);
      
            console.log('Password updated successfully');
            return { message: 'Password updated successfully' };
          } catch (error) {
            console.error('Error updating password:', error.message);
            return { message: 'Error updating password' };
          }
    }
 
    //changephoto
  
    @Post(':iduser/updatephoto')
    @UseInterceptors(FileInterceptor('file',{
        fileFilter: (req, file ,cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
                return cb(null, false);
            }
            cb(null, true);
        }
    }))
    async updatephoto(
        @Param('iduser') iduser: number,
        @UploadedFile() photo?: Express.Multer.File,
    ) {
        try {
            const user = await this.userService.findOneById(iduser);
            if (!user) {
                return { status: 'error', message :'User not found' };
            }

            if (photo) {
                if (user.imageUser && user.imageUser !== 'avatar.png') {
                    const oldPhotoPath = path.join(__dirname, '..', '..', 'upload-photos', user.imageUser);
                    if (fs.existsSync(oldPhotoPath)) {
                        await this.deleteFile(oldPhotoPath);
                    }
                }

                const logoFileName = `${Date.now()}_${photo.originalname}`;
                const filePath = path.join(__dirname, '..', '..', 'upload-photos', logoFileName);
                await this.saveFile(photo.buffer, filePath);
                
                user.imageUser = logoFileName;
                await this.userService.changephoto(user.idUser, logoFileName);

                return { status: 'success', message: 'Photo updated successfully', data: logoFileName };
            } else {
                return { status: 'error', message: 'No photo provided' };
            }
        } catch (error) {
            console.error('Error updating photo:', error.message);
            return { status: 'error', message: 'An error occurred while updating the photo' };
        }
    }

    private saveFile(buffer: Buffer, filePath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const directory = path.dirname(filePath);
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
            }
            fs.writeFile(filePath, buffer, (error) => {
                if (error) {
                    console.error(`Error saving file at ${filePath}: ${error.message}`);
                    reject(error);
                } else {
                    console.log(`File saved successfully at ${filePath}`);
                    resolve();
                }
            });
        });
    }

    private async deleteFile(filePath: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const fileName = filePath.split('/').pop();
            if (fileName === 'avatar.png') {
                console.log(`File "${fileName}" is not deleted.`);
                resolve();
            } else {
                fs.unlink(filePath, (error: any) => {
                    if (error) {
                        console.error(`Error deleting file at ${filePath}: ${error.message}`);
                        reject(error);
                    } else {
                        console.log(`File deleted successfully at ${filePath}`);
                        resolve();
                    }
                });
            }
        });
    }
  

    //logout
    @Post('logout') 
    async logout( @Res({passthrough:true}) response:Response){
            response.clearCookie('jwt');

            return{
                message: 'sucess'
            }
    }
 
    @Get(':resetToken')
    async verifyResetToken(@Param('resetToken') resetToken: string): Promise<{ status: string; message: string }> {
      try {
        const result = await this.userService.verifyResetToken(resetToken);
    
        if (result.status === 'success') {
          return { status: 'success', message: 'Le token de réinitialisation est valide' };
        } else if (result.status === 'not-found') {
          return { status: 'not-found', message: `Le lien de réinitialisation n'a pas été trouvé. Veuillez en faire la demande pour obtenir un nouveau lien de réinitialisation ` };
        } else {
          return { status: 'error', message: 'Le lien de réinitialisation n\'est pas valide ou a expiré. Un nouveau lien de réinitialisation a été envoyé à votre adresse e-mail' };
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du jeton de réinitialisation :', error.message);
        return { status: 'error', message: 'Une erreur s\'est produite lors du traitement du jeton de réinitialisation' };
      }
    }
    

//change password par rettoken
@Put(':resetToken/change-password')
async resetPassword(
  @Param('resetToken') resetToken: string,
  @Body() body: { newpwd: string, comfpwd: string },
): Promise<{ status: string; message: string }> {
  try {
    const result = await this.userService.resetPassword(resetToken, body.newpwd, body.comfpwd);

    if (result.status === 'success') {
      return { status: 'success', message: 'Réinitialisation du mot de passe réussie' };
    } else {
      return { status: 'error', message: 'Les deux mots de passe ne sont pas identiques. Veuillez réessayer' };
    }
  } catch (error) {
    console.error('Error in resetPassword:', error.message);
    return { status: 'error', message: 'An error occurred while processing the password reset' };
  }
}
//updateprofile : http://localhost:3000/user/iduser
@Patch(':id')
    async updateProfile(
      @Param('id') id: number,
      @Body() UpdateUserDto: updateUserDto): Promise<user> {
      return await this.userService.updateUser(id, UpdateUserDto);
    }

}
