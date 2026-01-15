import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ClerkModule } from './clerk/clerk.module';
import { AdminModule } from './admin/admin.module';
import { ConversationModule } from './conversations/conversation.module';
import { UserPreferenceModule } from './user-preference/user-preference.module';



@Module({
  imports: [PrismaModule, UserModule, ClerkModule, AdminModule, ConversationModule, UserPreferenceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }




