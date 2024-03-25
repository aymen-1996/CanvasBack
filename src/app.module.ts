/* eslint-disable prettier/prettier */

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { invite } from "./invite/invite.entity";
import { projet } from "./projet/projet.entity";
import { user } from "./user/user.entity";
import { canvas } from "./canvas/canvas.entity";
import { block } from "./block/block.entity";
import { donnees } from "./donnees/donnees.entity";
import { UserModule } from "./user/user.module";
import { ProjetModule } from "./projet/projet.module";
import { InviteModule } from "./invite/invite.module";
import { CanvasModule } from "./canvas/canvas.module";
import { BlockModule } from "./block/block.module";
import { DonneesModule } from "./donnees/donnees.module";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { AuthModule } from "./auth/auth.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserService } from "./user/user.service";
import { EmailService } from "./user/email/email.service";


@Module({
  imports: [
   
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'canvas',
      entities: [invite,projet,user,canvas,block,donnees],
      synchronize: true,
    }),
    UserModule,
    ProjetModule,
    InviteModule,
    CanvasModule,
    BlockModule,
    DonneesModule,
    JwtModule,
    AuthModule
   
    
  ],
  controllers: [AppController],
  providers: [AppService,JwtService,UserService,EmailService],
})
export class AppModule {}
