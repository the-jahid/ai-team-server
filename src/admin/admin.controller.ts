// src/user/controllers/user-agent-selection.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
} from '@nestjs/common';
import { IsArray, ArrayNotEmpty, IsEnum } from 'class-validator';
import { AgentName } from '@prisma/client';
import { UserAgentSelectionService } from './admin.service';


// ---------- DTOs ----------
export class AgentsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AgentName, { each: true })
  agents!: AgentName[];
}

export class ToggleAgentDto {
  @IsEnum(AgentName)
  agent!: AgentName;
}

/**
 * Routes that target a user by ID
 * Base: /users/:id/agents
 */
@Controller('users/:id/agents')
export class UserAgentSelectionByIdController {
  constructor(private readonly svc: UserAgentSelectionService) {}

  // GET /users/:id/agents
  @Get()
  getSelected(@Param('id') userId: string) {
    return this.svc.getSelectedAgents(userId);
  }

  // PUT /users/:id/agents  { agents: AgentName[] }  (replace entire list)
  @Put()
  setSelected(@Param('id') userId: string, @Body() dto: AgentsDto) {
    return this.svc.setSelectedAgents(userId, dto.agents);
  }

  // PATCH /users/:id/agents/add  { agents: AgentName[] }
  @Patch('add')
  add(@Param('id') userId: string, @Body() dto: AgentsDto) {
    return this.svc.addAgents(userId, dto.agents);
  }

  // PATCH /users/:id/agents/remove  { agents: AgentName[] }
  @Patch('remove')
  remove(@Param('id') userId: string, @Body() dto: AgentsDto) {
    return this.svc.removeAgents(userId, dto.agents);
  }

  // PATCH /users/:id/agents/toggle  { agent: AgentName }
  @Patch('toggle')
  toggle(@Param('id') userId: string, @Body() dto: ToggleAgentDto) {
    return this.svc.toggleAgent(userId, dto.agent);
  }

  // DELETE /users/:id/agents
  @Delete()
  clear(@Param('id') userId: string) {
    return this.svc.clearAgents(userId);
  }
}

/**
 * Routes that target a user by Email
 * Base: /users/email/:email/agents
 */
@Controller('users/email/:email/agents')
export class UserAgentSelectionByEmailController {
  constructor(private readonly svc: UserAgentSelectionService) {}

  // GET /users/email/:email/agents
  @Get()
  getSelected(@Param('email') email: string) {
    return this.svc.getSelectedAgentsByEmail(email);
  }

  // PUT /users/email/:email/agents  { agents: AgentName[] } (replace)
  @Put()
  setSelected(@Param('email') email: string, @Body() dto: AgentsDto) {
    return this.svc.setSelectedAgentsByEmail(email, dto.agents);
  }

  // PATCH /users/email/:email/agents/add  { agents: AgentName[] }
  @Patch('add')
  add(@Param('email') email: string, @Body() dto: AgentsDto) {
    return this.svc.addAgentsByEmail(email, dto.agents);
  }

  // PATCH /users/email/:email/agents/remove  { agents: AgentName[] }
  @Patch('remove')
  remove(@Param('email') email: string, @Body() dto: AgentsDto) {
    return this.svc.removeAgentsByEmail(email, dto.agents);
  }

  // PATCH /users/email/:email/agents/toggle  { agent: AgentName }
  @Patch('toggle')
  toggle(@Param('email') email: string, @Body() dto: ToggleAgentDto) {
    return this.svc.toggleAgentByEmail(email, dto.agent);
  }

  // DELETE /users/email/:email/agents
  @Delete()
  clear(@Param('email') email: string) {
    return this.svc.clearAgentsByEmail(email);
  }
}
