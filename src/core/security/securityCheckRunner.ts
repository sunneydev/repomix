import type { SecretLintCoreConfig, SecretLintCoreResult } from '@secretlint/types';
import { lintSource } from '@secretlint/core';
import { creator } from '@secretlint/secretlint-rule-preset-recommend';
import { logger } from '../../shared/logger.js';
import { RawFile } from '../file/fileTypes.js';

export interface SuspiciousFileResult {
  filePath: string;
  messages: string[];
}

export const runSecurityCheck = async (rawFiles: RawFile[]): Promise<SuspiciousFileResult[]> => {
  const secretLintConfig = createSecretLintConfig();
  const suspiciousFilesResults: SuspiciousFileResult[] = [];

  for (const rawFile of rawFiles) {
    const secretLintResult = await runSecretLint(rawFile.path, rawFile.content, secretLintConfig);
    const isSuspicious = secretLintResult.messages.length > 0;
    if (isSuspicious) {
      suspiciousFilesResults.push({
        filePath: rawFile.path,
        messages: secretLintResult.messages.map((message) => message.message),
      });
    }
  }

  return suspiciousFilesResults;
};

export const runSecretLint = async (
  filePath: string,
  content: string,
  config: SecretLintCoreConfig,
): Promise<SecretLintCoreResult> => {
  const result = await lintSource({
    source: {
      filePath: filePath,
      content: content,
      ext: filePath.split('.').pop() || '',
      contentType: 'text',
    },
    options: {
      config: config,
    },
  });

  if (result.messages.length > 0) {
    logger.trace(`Found ${result.messages.length} issues in ${filePath}`);
    logger.trace(result.messages.map((message) => `  - ${message.message}`).join('\n'));
  }

  return result;
};

export const createSecretLintConfig = (): SecretLintCoreConfig => ({
  rules: [
    {
      id: '@secretlint/secretlint-rule-preset-recommend',
      rule: creator,
    },
  ],
});
