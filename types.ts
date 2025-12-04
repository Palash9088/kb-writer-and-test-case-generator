export interface TestCase {
  id: string;
  scenario: string;
  module: string;
  caseType: string;
  title: string;
  preconditions: string;
  steps: string;
  expectedResult: string;
  actualResult: string;
  result: string;
  comments: string;
  ticket: string;
  owner: string;
}

export enum GenerationMode {
  TEST_CASES = 'TEST_CASES',
  DOCUMENTATION = 'DOCUMENTATION',
}

export interface GeneratedContent {
  raw: string;
  testCases?: TestCase[];
  markdown?: string;
}

export type VideoFrame = {
  data: string; // base64
  timestamp: number;
}