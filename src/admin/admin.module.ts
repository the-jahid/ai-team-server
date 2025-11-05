// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserAgentSelectionByEmailController, UserAgentSelectionByIdController } from './admin.controller';
import { UserAgentSelectionService } from './admin.service';


@Module({
  controllers: [UserAgentSelectionByIdController, UserAgentSelectionByEmailController],
  providers: [PrismaService, UserAgentSelectionService],
  exports: [UserAgentSelectionService],
})
export class UserModule {}
