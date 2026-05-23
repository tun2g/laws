import { SKILLS, type SkillId } from '@laws/skill-prompts';
import type { ChatSessionKind } from '../entities/chat-session.entity';
import { FREE_SYSTEM_PROMPT } from '../constants/system-prompts';

/** Resolve the system prompt to inject for a given session kind. */
export function systemPromptFor(kind: ChatSessionKind): string {
  if (kind === 'free') return FREE_SYSTEM_PROMPT;
  const skill = SKILLS[kind as SkillId];
  return skill ? skill.systemPrompt : FREE_SYSTEM_PROMPT;
}
