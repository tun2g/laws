import { RESEARCH_SKILL_PROMPT } from './skills/research';
import { REVIEW_SKILL_PROMPT } from './skills/review';
import { TRANSLATE_SKILL_PROMPT } from './skills/translate';
import { DUAL_LANG_SKILL_PROMPT } from './skills/dual-lang';
import { DOCX_SKILL_PROMPT } from './skills/docx';
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
  /** Whether this skill needs live web access (web_search tool). */
  needsWebSearch: boolean;
}

export const SKILLS: Record<SkillId, SkillDefinition> = {
  research: {
    id: 'research',
    labelVi: 'Tra cứu thủ tục pháp lý',
    labelEn: 'Legal procedure research',
    descriptionVi:
      'Soạn dự thảo tư vấn pháp lý từ bối cảnh khách hàng, có trích dẫn văn bản pháp luật còn hiệu lực.',
    systemPrompt: RESEARCH_SKILL_PROMPT,
    needsWebSearch: true,
  },
  review: {
    id: 'review',
    labelVi: 'Rà soát dự thảo',
    labelEn: 'Draft review',
    descriptionVi:
      'Kiểm tra và hiệu chỉnh dự thảo tư vấn: trích dẫn, hiệu lực văn bản, phí, trình tự, ngôn ngữ.',
    systemPrompt: REVIEW_SKILL_PROMPT,
    needsWebSearch: true,
  },
  translate: {
    id: 'translate',
    labelVi: 'Dịch tài liệu pháp lý',
    labelEn: 'Legal translation',
    descriptionVi: 'Dịch tài liệu Việt ↔ Anh, giữ nguyên cấu trúc và thuật ngữ pháp lý.',
    systemPrompt: TRANSLATE_SKILL_PROMPT,
    needsWebSearch: false,
  },
  'dual-lang': {
    id: 'dual-lang',
    labelVi: 'Tạo bản song ngữ',
    labelEn: 'Dual-language render',
    descriptionVi: 'Ghép bản tiếng Việt và tiếng Anh thành một tài liệu song ngữ.',
    systemPrompt: DUAL_LANG_SKILL_PROMPT,
    needsWebSearch: false,
  },
  docx: {
    id: 'docx',
    labelVi: 'Xuất file Word',
    labelEn: 'Export to Word (.docx)',
    descriptionVi: 'Định dạng bản tư vấn ra file .docx theo mẫu công ty luật.',
    systemPrompt: DOCX_SKILL_PROMPT,
    needsWebSearch: false,
  },
};

export const skillList = (): SkillDefinition[] => Object.values(SKILLS);

export { OUTPUT_TEMPLATE };
export {
  RESEARCH_SKILL_PROMPT,
  REVIEW_SKILL_PROMPT,
  TRANSLATE_SKILL_PROMPT,
  DUAL_LANG_SKILL_PROMPT,
  DOCX_SKILL_PROMPT,
};
