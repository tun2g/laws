import { loadSkill, SKILLS_ROOT, WORKSPACE_SKILL_PARENT } from './loader';
import { OUTPUT_TEMPLATE } from './templates/output-template';

export type SkillId = 'research' | 'review' | 'translate' | 'dual-lang' | 'docx';

export interface SkillDefinition {
  id: SkillId;
  /** Vietnamese-facing label shown to non-tech end users in the web UI. */
  labelVi: string;
  /** English label, for admin panel. */
  labelEn: string;
  /** Short one-line description (Vietnamese) for empty states and pickers. */
  descriptionVi: string;
  /** System prompt fed to the LLM when running this skill. */
  systemPrompt: string;
  /** Absolute path to the on-disk skill folder; staged into the workspace at run time. */
  skillDir: string;
  /** Whether this skill needs live web access (web_search tool). */
  needsWebSearch: boolean;
}

interface SkillMeta {
  labelVi: string;
  labelEn: string;
  descriptionVi: string;
  needsWebSearch: boolean;
}

/**
 * UI-facing metadata. Kept separate from SKILL.md so SKILL.md can stay in
 * sync with cclaws verbatim (no bilingual labels there) while we add the
 * Vietnamese labels needed for the web UI.
 */
const META: Record<SkillId, SkillMeta> = {
  research: {
    labelVi: 'Tra cứu thủ tục pháp lý',
    labelEn: 'Legal procedure research',
    descriptionVi:
      'Soạn dự thảo tư vấn pháp lý từ bối cảnh khách hàng, có trích dẫn văn bản pháp luật còn hiệu lực.',
    needsWebSearch: true,
  },
  review: {
    labelVi: 'Rà soát dự thảo',
    labelEn: 'Draft review',
    descriptionVi:
      'Kiểm tra và hiệu chỉnh dự thảo tư vấn: trích dẫn, hiệu lực văn bản, phí, trình tự, ngôn ngữ.',
    needsWebSearch: true,
  },
  translate: {
    labelVi: 'Dịch tài liệu pháp lý',
    labelEn: 'Legal translation',
    descriptionVi: 'Dịch tài liệu Việt ↔ Anh, giữ nguyên cấu trúc và thuật ngữ pháp lý.',
    needsWebSearch: false,
  },
  'dual-lang': {
    labelVi: 'Tạo bản song ngữ',
    labelEn: 'Dual-language render',
    descriptionVi: 'Ghép bản tiếng Việt và tiếng Anh thành một tài liệu song ngữ.',
    needsWebSearch: false,
  },
  docx: {
    labelVi: 'Xuất file Word',
    labelEn: 'Export to Word (.docx)',
    descriptionVi: 'Định dạng bản tư vấn ra file .docx theo mẫu công ty luật.',
    needsWebSearch: false,
  },
};

function build(id: SkillId): SkillDefinition {
  const loaded = loadSkill(id);
  const meta = META[id];
  return {
    id,
    labelVi: meta.labelVi,
    labelEn: meta.labelEn,
    descriptionVi: meta.descriptionVi,
    systemPrompt: loaded.systemPrompt,
    skillDir: loaded.dir,
    needsWebSearch: meta.needsWebSearch,
  };
}

export const SKILLS: Record<SkillId, SkillDefinition> = {
  research: build('research'),
  review: build('review'),
  translate: build('translate'),
  'dual-lang': build('dual-lang'),
  docx: build('docx'),
};

export const skillList = (): SkillDefinition[] => Object.values(SKILLS);

export { OUTPUT_TEMPLATE, SKILLS_ROOT, WORKSPACE_SKILL_PARENT };
