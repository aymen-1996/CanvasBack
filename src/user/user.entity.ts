/* eslint-disable prettier/prettier */
import { invite } from "src/invite/invite.entity";
import { projet } from "src/projet/projet.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'user'})
export class user {
    @PrimaryGeneratedColumn({ type: 'bigint'})
    idUser: number;

    @Column({ nullable: true }) 
    nomUser:string; 

    @Column({ nullable: true }) 
    prenomUser:string; 

    @Column({ nullable: true }) 
    emailUser:string; 

    @Column({ nullable: true }) 
    passwordUser:string; 

    @Column({ nullable: true }) 
    gov:string; 

    @Column({  type: 'date', nullable: true }) 
    datenaissance:Date; 

    @Column({ nullable: true }) 
    adresse:string; 

    @Column({ nullable: true }) 
    education:string; 

    @Column({ nullable: true }) 
    qualification:string; 

    @Column({ nullable: true }) 
    cv:string; 

    @Column({ nullable: true }) 
    imageUser:string; 

    @Column({ nullable: true }) 
    genre:string; 

    @Column({ nullable: true }) 
    role:string; 


    @Column({ nullable: true })
    resetToken: string;
  
    @Column({ nullable: true })
    resetTokenExpiration: Date;
    
    @OneToMany(() => projet, (projet) => projet.user)
    Projet: projet[];

    @Column({ nullable: true })
    resetCode: number;

        @OneToMany(() => invite, (invite) => invite.user)
        invite: invite[];

}