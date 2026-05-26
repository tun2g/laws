import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

/** Where the LLM finds the staged skill folder inside the user's workspace. */
export const WORKSPACE_SKILL_PARENT = '.skills';

/**
 * Absolute path to the on-disk skills root. Resolves to the source folder in
 * dev (`packages/skill-prompts/skills/`) and the same layout post-build —
 * `tsc` emits to `dist/` so `__dirname/..` lands on the package root either
 * way.
 */
export const SKILLS_ROOT = path.resolve(__dirname, '..', 'skills');

export interface LoadedSkill {
  id: string;
  /** Skill name as written in SKILL.md frontmatter. */
  name: string;
  /** One-line description from SKILL.md frontmatter (used in pickers). */
  description: string;
  /** Absolute path to the skill folder on disk. */
  dir: string;
  /** SKILL.md body with paths rewritten + references appended. */
  systemPrompt: string;
}

/** Load a single skill by its folder name under SKILLS_ROOT. */
export function loadSkill(id: string): LoadedSkill {
  const dir = path.join(SKILLS_ROOT, id);
  const raw = readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  const { frontmatter, body } = splitFrontmatter(raw);

  const name = parseFrontmatterScalar(frontmatter, 'name') ?? id;
  const description = parseFrontmatterScalar(frontmatter, 'description') ?? '';

  const references = readReferences(dir);
  const rewrittenBody = rewriteSkillPaths(body, name, id);
  const systemPrompt = references
    ? `${rewrittenBody.trim()}\n\n---\n\n## Reference material (bundled with this skill)\n\n${references}`
    : rewrittenBody.trim();

  return { id, name, description, dir, systemPrompt };
}

/**
 * Split YAML frontmatter (between two `---` markers) from the body. Returns
 * `{ frontmatter: '', body: raw }` when no frontmatter is present.
 */
function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  if (!raw.startsWith('---\n')) return { frontmatter: '', body: raw };
  const end = raw.indexOf('\n---\n', 4);
  if (end < 0) return { frontmatter: '', body: raw };
  return {
    frontmatter: raw.slice(4, end),
    body: raw.slice(end + 5),
  };
}

/**
 * Minimal YAML scalar parser — handles `key: value`, `key: "quoted value"`,
 * and `key: 'single quoted'`. Sufficient for SKILL.md frontmatter, which
 * never uses lists, anchors, or block scalars.
 */
function parseFrontmatterScalar(frontmatter: string, key: string): string | null {
  const re = new RegExp(`^${escapeRegExp(key)}\\s*:\\s*(.*)$`, 'm');
  const m = frontmatter.match(re);
  if (!m) return null;
  let v = m[1]!.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Concatenate every reference markdown file under the skill folder. */
function readReferences(skillDir: string): string {
  const refDir = path.join(skillDir, 'references');
  if (!safeIsDirectory(refDir)) return '';
  const files = readdirSync(refDir)
    .filter((f) => f.endsWith('.md'))
    .sort();
  if (files.length === 0) return '';
  return files
    .map((f) => {
      const content = readFileSync(path.join(refDir, f), 'utf8').trim();
      return `### references/${f}\n\n${content}`;
    })
    .join('\n\n');
}

function safeIsDirectory(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Rewrite the cclaws-style script paths to match our deployment layout.
 *
 * cclaws SKILL.md hardcodes `.claude/skills/vn-legal-<id>/...`. In our
 * server we stage the skill into `<workspace>/.skills/<id>/`, so we
 * substitute those prefixes before handing the prompt to Codex.
 */
function rewriteSkillPaths(body: string, frontmatterName: string, ourId: string): string {
  const targetPrefix = `${WORKSPACE_SKILL_PARENT}/${ourId}`;
  const candidates = [
    `.claude/skills/${frontmatterName}`,
    `.claude/skills/${ourId}`,
  ];
  let out = body;
  for (const c of candidates) {
    out = out.split(c).join(targetPrefix);
  }
  return out;
}
