// src/user/services/user-agent-selection.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AgentName, Prisma } from '@prisma/client';

type UserSelector = { id: string } | { email: string };

/**
 * Service dedicated to updating the user's selected agents (enum[]).
 * Supports identifying users by ID or by Email.
 */
@Injectable()
export class UserAgentSelectionService {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------- PUBLIC (by ID) -----------------

  /** Return current selection for a user (by ID) */
  async getSelectedAgents(userId: string): Promise<AgentName[]> {
    const user = await this.resolveUser({ id: userId }, { selectedAgents: true });
    return user.selectedAgents ?? [];
  }

  /** Replace entire selection (by ID) */
  async setSelectedAgents(
    userId: string,
    agents: (AgentName | string)[],
  ): Promise<AgentName[]> {
    const clean = this.validateAndNormalize(agents);
    await this.resolveUser({ id: userId }, { id: true });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { selectedAgents: { set: clean } },
      select: { selectedAgents: true },
    });
    return updated.selectedAgents;
  }

  /** Add one or more agents (by ID) */
  async addAgents(
    userId: string,
    agentsToAdd: (AgentName | string)[],
  ): Promise<AgentName[]> {
    const add = this.validateAndNormalize(agentsToAdd);
    const current = await this.getSelectedAgents(userId);
    const set = this.dedupe([...current, ...add]);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { selectedAgents: { set } },
      select: { selectedAgents: true },
    });
    return updated.selectedAgents;
  }

  /** Remove one or more agents (by ID) */
  async removeAgents(
    userId: string,
    agentsToRemove: (AgentName | string)[],
  ): Promise<AgentName[]> {
    const remove = new Set(this.validateAndNormalize(agentsToRemove));
    const current = await this.getSelectedAgents(userId);
    const set = current.filter((a) => !remove.has(a));

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { selectedAgents: { set } },
      select: { selectedAgents: true },
    });
    return updated.selectedAgents;
  }

  /** Toggle a single agent (by ID) */
  async toggleAgent(userId: string, agent: AgentName | string): Promise<AgentName[]> {
    const [normalized] = this.validateAndNormalize([agent]);
    const current = await this.getSelectedAgents(userId);
    const exists = current.includes(normalized);
    const set = exists ? current.filter((a) => a !== normalized) : this.dedupe([...current, normalized]);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { selectedAgents: { set } },
      select: { selectedAgents: true },
    });
    return updated.selectedAgents;
  }

  /** Clear all (by ID) */
  async clearAgents(userId: string): Promise<AgentName[]> {
    await this.resolveUser({ id: userId }, { id: true });
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { selectedAgents: { set: [] } },
      select: { selectedAgents: true },
    });
    return updated.selectedAgents;
  }

  // ----------------- PUBLIC (by Email) -----------------

  /** Return current selection (by Email) */
  async getSelectedAgentsByEmail(email: string): Promise<AgentName[]> {
    const user = await this.resolveUser({ email }, { selectedAgents: true });
    return user.selectedAgents ?? [];
  }

  /** Replace entire selection (by Email) */
  async setSelectedAgentsByEmail(
    email: string,
    agents: (AgentName | string)[],
  ): Promise<AgentName[]> {
    const clean = this.validateAndNormalize(agents);
    const u = await this.resolveUser({ email }, { id: true });

    const updated = await this.prisma.user.update({
      where: { id: u.id },
      data: { selectedAgents: { set: clean } },
      select: { selectedAgents: true },
    });
    return updated.selectedAgents;
  }

  /** Add one or more agents (by Email) */
  async addAgentsByEmail(
    email: string,
    agentsToAdd: (AgentName | string)[],
  ): Promise<AgentName[]> {
    const add = this.validateAndNormalize(agentsToAdd);
    const current = await this.getSelectedAgentsByEmail(email);
    const set = this.dedupe([...current, ...add]);

    const u = await this.resolveUser({ email }, { id: true });
    const updated = await this.prisma.user.update({
      where: { id: u.id },
      data: { selectedAgents: { set } },
      select: { selectedAgents: true },
    });
    return updated.selectedAgents;
  }

  /** Remove one or more agents (by Email) */
  async removeAgentsByEmail(
    email: string,
    agentsToRemove: (AgentName | string)[],
  ): Promise<AgentName[]> {
    const remove = new Set(this.validateAndNormalize(agentsToRemove));
    const current = await this.getSelectedAgentsByEmail(email);
    const set = current.filter((a) => !remove.has(a));

    const u = await this.resolveUser({ email }, { id: true });
    const updated = await this.prisma.user.update({
      where: { id: u.id },
      data: { selectedAgents: { set } },
      select: { selectedAgents: true },
    });
    return updated.selectedAgents;
  }

  /** Toggle a single agent (by Email) */
  async toggleAgentByEmail(email: string, agent: AgentName | string): Promise<AgentName[]> {
    const [normalized] = this.validateAndNormalize([agent]);
    const current = await this.getSelectedAgentsByEmail(email);
    const exists = current.includes(normalized);
    const set = exists ? current.filter((a) => a !== normalized) : this.dedupe([...current, normalized]);

    const u = await this.resolveUser({ email }, { id: true });
    const updated = await this.prisma.user.update({
      where: { id: u.id },
      data: { selectedAgents: { set } },
      select: { selectedAgents: true },
    });
    return updated.selectedAgents;
  }

  /** Clear all (by Email) */
  async clearAgentsByEmail(email: string): Promise<AgentName[]> {
    const u = await this.resolveUser({ email }, { id: true });
    const updated = await this.prisma.user.update({
      where: { id: u.id },
      data: { selectedAgents: { set: [] } },
      select: { selectedAgents: true },
    });
    return updated.selectedAgents;
  }

  // ----------------- helpers -----------------

  /**
   * Resolve user by selector with a properly typed Prisma `select`.
   * This fixes the TS error by constraining `S` to `Prisma.UserSelect`
   * and returning `Prisma.UserGetPayload<{ select: S }>` accordingly.
   */
  private async resolveUser<S extends Prisma.UserSelect>(
    selector: UserSelector,
    select: S,
  ): Promise<Prisma.UserGetPayload<{ select: S }>> {
    const where = 'id' in selector ? { id: selector.id } : { email: selector.email };
    const user = await this.prisma.user.findUnique({ where, select });
    if (!user) throw new NotFoundException('User not found');
    return user as Prisma.UserGetPayload<{ select: S }>;
  }

  /** Validate strings against AgentName enum and return a deduped list */
  private validateAndNormalize(values: (AgentName | string)[]): AgentName[] {
    if (!Array.isArray(values)) {
      throw new BadRequestException('agents must be an array');
    }
    const valid = new Set<AgentName>(Object.values(AgentName));
    const out: AgentName[] = [];
    for (const v of values) {
      const upper = String(v).trim().toUpperCase() as AgentName;
      if (!valid.has(upper)) {
        throw new BadRequestException(
          `Invalid agent name: "${v}". Allowed: ${Array.from(valid).join(', ')}`,
        );
      }
      out.push(upper);
    }
    return this.dedupe(out);
  }

  private dedupe(arr: AgentName[]): AgentName[] {
    const seen = new Set<AgentName>();
    const result: AgentName[] = [];
    for (const a of arr) {
      if (!seen.has(a)) {
        seen.add(a);
        result.push(a);
      }
    }
    return result;
  }
}
