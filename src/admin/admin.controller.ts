// src/admin/admin.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  IsArray,
  ArrayMinSize,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  ValidateIf,
  IsUUID,
  IsString,
  ValidateNested,
  IsIn,
  Max,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AdminService } from './admin.service';
import { AgentName } from '@prisma/client';

/* ------------------------- helpers for transforms ------------------------- */
const toNumber = ({ value }: { value: any }) => {
  if (value === '' || value === undefined || value === null) return undefined;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isNaN(n) ? undefined : n;
};

/** Allows Date | string | null | undefined; maps '' -> undefined, null -> null */
const toDateOrNull = ({ value }: { value: any }) => {
  if (value === '' || value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
};

const toDate = ({ value }: { value: any }) => {
  if (value === '' || value === undefined || value === null) return undefined;
  return new Date(value);
};

const toBool = ({ value }: { value: any }) => {
  if (typeof value === 'string') return value === 'true';
  return Boolean(value);
};

/* --------------------------------- DTOs ---------------------------------- */
/** ---------- Assignment DTOs (single & bulk) ---------- */
class AssignSingleDto {
  @IsEmail()
  email!: string;

  @IsEnum(AgentName)
  agentName!: AgentName;

  @IsOptional()
  @Transform(toDate)
  startsAt?: Date;

  // overrides durationDays if provided; pass null to clear
  @IsOptional()
  @ValidateIf((o) => o.expiresAt !== undefined)
  @Transform(toDateOrNull)
  expiresAt?: Date | null;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class AssignBulkDto {
  @IsEmail()
  email!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(AgentName, { each: true })
  agentNames!: AgentName[];

  @IsOptional()
  @Transform(toDate)
  startsAt?: Date;

  @IsOptional()
  @ValidateIf((o) => o.expiresAt !== undefined)
  @Transform(toDateOrNull)
  expiresAt?: Date | null;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class DeactivateDto {
  @IsEmail()
  email!: string;

  @IsEnum(AgentName)
  agentName!: AgentName;
}

class ListByEmailQuery {
  @IsEmail()
  email!: string;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  activeOnly?: boolean;
}

class SelectedAgentsQuery {
  @IsEmail()
  email!: string;
}

/** ---------- Group selection for assignment ---------- */
class GroupSelectorDto {
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsString()
  groupName?: string;
}

class AssignGroupByEmailDto {
  @IsEmail()
  email!: string;

  @ValidateNested()
  @Type(() => GroupSelectorDto)
  selector!: GroupSelectorDto;

  @IsOptional()
  @Transform(toDate)
  startsAt?: Date;

  @IsOptional()
  @ValidateIf((o) => o.expiresAt !== undefined)
  @Transform(toDateOrNull)
  expiresAt?: Date | null;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class AssignGroupsByEmailDto {
  @IsEmail()
  email!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GroupSelectorDto)
  selectors!: GroupSelectorDto[];

  @IsOptional()
  @Transform(toDate)
  startsAt?: Date;

  @IsOptional()
  @ValidateIf((o) => o.expiresAt !== undefined)
  @Transform(toDateOrNull)
  expiresAt?: Date | null;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** ---------- Group CRUD DTOs ---------- */
class CreateGroupDto {
  @IsString()
  @Length(1, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class GroupIdParam {
  @IsUUID()
  id!: string;
}

class ListGroupsQuery {
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  nameContains?: string;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'name'])
  sortBy?: 'createdAt' | 'updatedAt' | 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

class AgentsArrayDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(AgentName, { each: true })
  agentNames!: AgentName[];
}

/** ---------- Create group with agents (+ optional assign) ---------- */
class CreateGroupWithAgentsDto {
  @IsString()
  @Length(1, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(AgentName, { each: true })
  agentNames!: AgentName[];
}

class CreateGroupWithAgentsAndAssignDto extends CreateGroupWithAgentsDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @Transform(toDate)
  startsAt?: Date;

  @IsOptional()
  @ValidateIf((o) => o.expiresAt !== undefined)
  @Transform(toDateOrNull)
  expiresAt?: Date | null;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  isActiveAssignment?: boolean;
}

/* ===== NEW: GROUP ASSIGNMENT via AssignedGroup (admin + user) ===== */

/** Admin: assign a GROUP to user (optionally also assign the group's agents) */
class AssignGroupToUserByEmailDto {
  @IsEmail()
  email!: string;

  @ValidateNested()
  @Type(() => GroupSelectorDto)
  selector!: GroupSelectorDto;

  @IsOptional()
  @Transform(toDate)
  startsAt?: Date;

  @IsOptional()
  @ValidateIf((o) => o.expiresAt !== undefined)
  @Transform(toDateOrNull)
  expiresAt?: Date | null;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** default true: also materialize per-agent assignments */
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  alsoAssignAgents?: boolean;
}

/** Admin: deactivate a GROUP assignment for a given user */
class DeactivateGroupByEmailDto {
  @IsEmail()
  email!: string;

  @ValidateNested()
  @Type(() => GroupSelectorDto)
  selector!: GroupSelectorDto;
}

/** Admin: list GROUP assignments for a user */
class ListGroupAssignmentsQuery {
  @IsEmail()
  email!: string;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  activeOnly?: boolean;
}

/** User self-service: update their group assignment */
class UpdateMyGroupAssignmentDto {
  @IsEmail()
  email!: string;

  @ValidateNested()
  @Type(() => GroupSelectorDto)
  selector!: GroupSelectorDto;

  @IsOptional()
  @Transform(toDate)
  startsAt?: Date;

  @IsOptional()
  @ValidateIf((o) => o.expiresAt !== undefined)
  @Transform(toDateOrNull)
  expiresAt?: Date | null;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** User self-service: extend/reduce assignment by N days */
class ExtendMyGroupAssignmentDto {
  @IsEmail()
  email!: string;

  @ValidateNested()
  @Type(() => GroupSelectorDto)
  selector!: GroupSelectorDto;

  @Transform(toNumber)
  @IsInt()
  @Min(-3650)
  @Max(3650)
  addDays!: number;
}

/** User self-service: deactivate (opt-out) */
class DeactivateMyGroupAssignmentDto {
  @IsEmail()
  email!: string;

  @ValidateNested()
  @Type(() => GroupSelectorDto)
  selector!: GroupSelectorDto;
}

/* ------------------------------- Controller ------------------------------- */

@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /** Assign a single agent to a user by email (create or update active record) */
  @Post('assign')
  assignSingle(@Body() dto: AssignSingleDto) {
    return this.admin.assignAgentByEmail(dto.email, dto.agentName, {
      startsAt: dto.startsAt,
      expiresAt: dto.expiresAt,
      durationDays: dto.durationDays,
      isActive: dto.isActive,
    });
  }

  /** Assign multiple agents to a user by email (single transaction) */
  @Post('assign/bulk')
  assignBulk(@Body() dto: AssignBulkDto) {
    return this.admin.assignAgentsByEmail(dto.email, dto.agentNames, {
      startsAt: dto.startsAt,
      expiresAt: dto.expiresAt,
      durationDays: dto.durationDays,
      isActive: dto.isActive,
    });
  }

  /** Deactivate an active assignment for a user by email */
  @Post('deactivate')
  deactivate(@Body() dto: DeactivateDto) {
    return this.admin.deactivateAgentByEmail(dto.email, dto.agentName);
  }

  /** List assignments for a user by email (use ?activeOnly=true to filter) */
  @Get('assignments')
  listByEmail(@Query() q: ListByEmailQuery) {
    return this.admin.listAssignmentsByEmail(q.email, q.activeOnly ?? false);
  }

  /** Get only the selected agents (active and not expired) for a user by email */
  @Get('selected-agents')
  getSelected(@Query() q: SelectedAgentsQuery) {
    return this.admin.getSelectedAgentsByEmail(q.email);
  }

  /**
   * Assign all agents from a single group (identified by id or name) to a user by email.
   * NOTE: Service now also UPSERTS an AssignedGroup for (user, group) automatically.
   * Response is still AssignedAgent[] for backward compatibility.
   */
  @Post('assign/group')
  assignGroup(@Body() dto: AssignGroupByEmailDto) {
    const { selector } = dto;
    if (!selector?.groupId && !selector?.groupName) {
      throw new BadRequestException('Provide selector.groupId or selector.groupName');
    }
    return this.admin.assignAgentGroupByEmail(
      dto.email,
      selector.groupId ? { groupId: selector.groupId } : { groupName: selector.groupName! },
      {
        startsAt: dto.startsAt,
        expiresAt: dto.expiresAt,
        durationDays: dto.durationDays ?? undefined,
        isActive: dto.isActive,
      },
    );
  }

  /** Assign all agents from multiple groups (merge & dedupe) to a user by email */
  @Post('assign/groups')
  assignGroups(@Body() dto: AssignGroupsByEmailDto) {
    const selectors = dto.selectors.map((s) => {
      if (!s.groupId && !s.groupName) {
        throw new BadRequestException('Each selector must have groupId or groupName');
      }
      return s.groupId ? { groupId: s.groupId } : { groupName: s.groupName! };
    });

    return this.admin.assignAgentGroupsByEmail(dto.email, selectors, {
      startsAt: dto.startsAt,
      expiresAt: dto.expiresAt,
      durationDays: dto.durationDays ?? undefined,
      isActive: dto.isActive,
    });
  }

  /* ========================= GROUP CRUD ROUTES ========================= */

  /** Create a bare group (no members) */
  @Post('groups')
  createGroup(@Body() dto: CreateGroupDto) {
    return this.admin.createAgentGroup(dto);
  }

  /** Update a group by id */
  @Patch('groups/:id')
  updateGroup(@Param() p: GroupIdParam, @Body() dto: UpdateGroupDto) {
    return this.admin.updateAgentGroup(p.id, dto);
  }

  /** Delete a group by id (cascades to items & assignments) */
  @Delete('groups/:id')
  deleteGroup(@Param() p: GroupIdParam) {
    return this.admin.deleteAgentGroup(p.id);
  }

  /** List groups with filters + pagination */
  @Get('groups')
  listGroups(@Query() q: ListGroupsQuery) {
    return this.admin.listAgentGroups(q);
  }

  /** Add agents to a group (deduped, idempotent) */
  @Post('groups/:id/agents')
  addAgents(@Param() p: GroupIdParam, @Body() dto: AgentsArrayDto) {
    return this.admin.addAgentsToGroup(p.id, dto.agentNames);
  }

  /** Remove specific agents from a group */
  @Delete('groups/:id/agents')
  removeAgents(@Param() p: GroupIdParam, @Body() dto: AgentsArrayDto) {
    return this.admin.removeAgentsFromGroup(p.id, dto.agentNames);
  }

  /** Replace all agents in a group with provided list (transactional) */
  @Put('groups/:id/agents')
  replaceAgents(@Param() p: GroupIdParam, @Body() dto: AgentsArrayDto) {
    return this.admin.replaceGroupAgents(p.id, dto.agentNames);
  }

  /* ======= CREATE GROUP WITH AGENTS (and optional immediate assign) ======= */

  /** Create a group and its agents in one step */
  @Post('groups-with-agents')
  createGroupWithAgents(@Body() dto: CreateGroupWithAgentsDto) {
    return this.admin.createAgentGroupWithAgents(dto);
  }

  /** Create a group with agents and assign that group to a user by email (agent-level materialization) */
  @Post('groups-with-agents/assign')
  createGroupWithAgentsAndAssign(@Body() dto: CreateGroupWithAgentsAndAssignDto) {
    return this.admin.createGroupWithAgentsAndAssignByEmail(
      dto.email,
      {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
        agentNames: dto.agentNames,
      },
      {
        startsAt: dto.startsAt,
        expiresAt: dto.expiresAt,
        durationDays: dto.durationDays ?? undefined,
        isActive: dto.isActiveAssignment,
      },
    );
  }

  /* ==================== GROUP ASSIGNMENT via AssignedGroup ==================== */

  /** Admin: assign a GROUP to a user (creates/updates AssignedGroup; optionally also assigns per-agent) */
  @Post('group-assignments')
  assignGroupToUser(@Body() dto: AssignGroupToUserByEmailDto) {
    const { selector } = dto;
    if (!selector?.groupId && !selector?.groupName) {
      throw new BadRequestException('Provide selector.groupId or selector.groupName');
    }
    return this.admin.assignGroupToUserByEmail(
      dto.email,
      selector.groupId ? { groupId: selector.groupId } : { groupName: selector.groupName! },
      {
        startsAt: dto.startsAt,
        expiresAt: dto.expiresAt,
        durationDays: dto.durationDays ?? undefined,
        isActive: dto.isActive,
      },
      dto.alsoAssignAgents ?? true,
    );
  }

  /** Admin: list GROUP assignments for a user */
  @Get('group-assignments')
  listGroupAssignments(@Query() q: ListGroupAssignmentsQuery) {
    return this.admin.listGroupAssignmentsByEmail(q.email, q.activeOnly ?? false);
  }

  /** Admin: deactivate a GROUP assignment for a user */
  @Post('group-assignments/deactivate')
  deactivateGroupAssignment(@Body() dto: DeactivateGroupByEmailDto) {
    const { selector } = dto;
    if (!selector?.groupId && !selector?.groupName) {
      throw new BadRequestException('Provide selector.groupId or selector.groupName');
    }
    return this.admin.deactivateGroupByEmail(
      dto.email,
      selector.groupId ? { groupId: selector.groupId } : { groupName: selector.groupName! },
    );
  }

  /* ========================== USER SELF-SERVICE ========================== */

  /** User: update their own GROUP assignment fields */
  @Patch('my/group-assignment')
  updateMyGroupAssignment(@Body() dto: UpdateMyGroupAssignmentDto) {
    const { selector } = dto;
    if (!selector?.groupId && !selector?.groupName) {
      throw new BadRequestException('Provide selector.groupId or selector.groupName');
    }
    return this.admin.updateMyGroupAssignmentByEmail(
      dto.email,
      selector.groupId ? { groupId: selector.groupId } : { groupName: selector.groupName! },
      {
        startsAt: dto.startsAt,
        expiresAt: dto.expiresAt,
        durationDays: dto.durationDays ?? undefined,
        isActive: dto.isActive,
      },
    );
  }

  /** User: extend/reduce their GROUP assignment by N days */
  @Post('my/group-assignment/extend')
  extendMyGroupAssignment(@Body() dto: ExtendMyGroupAssignmentDto) {
    const { selector } = dto;
    if (!selector?.groupId && !selector?.groupName) {
      throw new BadRequestException('Provide selector.groupId or selector.groupName');
    }
    return this.admin.extendMyGroupAssignmentByEmail(
      dto.email,
      selector.groupId ? { groupId: selector.groupId } : { groupName: selector.groupName! },
      dto.addDays,
    );
  }
  // src/admin/admin.controller.ts
  @Get('groups/:id/agents')
  getGroupAgents(@Param() p: GroupIdParam) {
    return this.admin.listGroupAgents(p.id);
  }

    /** GET /users/emails -> string[] (all user emails) */
  @Get('emails')
  async listAllEmails(): Promise<string[]> {
    return this.admin.listAllEmails();
  }

  /** User: deactivate (opt-out) their GROUP assignment */
  @Post('my/group-assignment/deactivate')
  deactivateMyGroupAssignment(@Body() dto: DeactivateMyGroupAssignmentDto) {
    const { selector } = dto;
    if (!selector?.groupId && !selector?.groupName) {
      throw new BadRequestException('Provide selector.groupId or selector.groupName');
    }
    return this.admin.deactivateMyGroupAssignmentByEmail(
      dto.email,
      selector.groupId ? { groupId: selector.groupId } : { groupName: selector.groupName! },
    );
  }
}
