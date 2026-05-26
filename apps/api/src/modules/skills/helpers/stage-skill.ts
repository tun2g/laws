import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { WORKSPACE_SKILL_PARENT, type SkillDefinition } from '@laws/skill-prompts';

/**
 * Materialize a skill folder (SKILL.md + scripts/ + references/ + assets/)
 * into the user's project workspace at `<workspace>/.skills/<id>/`.
 *
 * The SKILL.md the LLM sees already has paths rewritten to point here, so
 * after staging it can run `python3 .skills/<id>/scripts/foo.py`.
 *
 * Idempotent: nukes any prior staging for the same skill so a re-deploy
 * with new scripts always wins, then copies fresh.
 *
 * Returns the workspace-relative skill path (e.g. `.skills/docx`) for any
 * caller that wants to inject it into prompts at run time.
 */
export async function stageSkillIntoWorkspace(
  workspace: string,
  skill: SkillDefinition,
): Promise<string> {
  const parent = path.join(workspace, WORKSPACE_SKILL_PARENT);
  const dest = path.join(parent, skill.id);
  await mkdir(parent, { recursive: true });
  await rm(dest, { recursive: true, force: true });
  await cp(skill.skillDir, dest, { recursive: true });
  return path.join(WORKSPACE_SKILL_PARENT, skill.id);
}
