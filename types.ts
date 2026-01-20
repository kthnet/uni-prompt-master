export type RoleType = 'PROFESSOR' | 'ADMIN_PLANNING' | 'ADMIN_AFFAIRS' | 'EXECUTIVE';
export type TaskType = 'NATIONAL_PROJECT' | 'GENERAL_ADMIN' | 'ACADEMIC_RESEARCH' | 'ADMISSION_PR';

export interface AnalysisPoint {
  tag: string;
  content: string;
  source: 'Google' | 'OpenAI' | 'Anthropic' | 'Common';
  color: 'indigo' | 'purple' | 'green' | 'blue';
}

export interface GeneratedResult {
  prompt: string;
  analysis: AnalysisPoint[];
  tip: string;
}

export interface FormData {
  role: RoleType;
  task: TaskType;
  context: string;
}

export interface SavedPrompt {
  id: string;
  title: string;
  category: string;
  content: string; // The raw content with {variables}
  variables: string[]; // Extracted variable names
  created_at?: string; // Supabase timestamp field (optional for local creation)
}