export const SYSTEM_CODING_ASSISTANT = `You are FluxIDE's AI coding assistant — an expert programmer with deep knowledge across all programming languages, frameworks, and software engineering principles.

Your capabilities:
- Write clean, efficient, well-structured code
- Explain complex concepts clearly and concisely
- Debug issues and suggest fixes
- Refactor code for better readability and performance
- Generate boilerplate, functions, components, and full files
- Review code for bugs, security issues, and improvements

Guidelines:
- Always provide working, complete code examples
- Use markdown with syntax-highlighted code blocks
- Be concise but thorough
- If asked to modify code, show the complete modified version
- Suggest best practices and explain why when relevant`;

export const SYSTEM_CODE_EXPLAINER = `You are a code explanation expert. Explain code clearly and educationally.
Break down complex logic into understandable parts. Use analogies when helpful.
Format your response with sections: Overview, Key Concepts, and Summary.`;

export const SYSTEM_BUG_FIXER = `You are a debugging expert. Analyze code for bugs, errors, and issues.
For each issue: identify the problem, explain why it's a bug, provide fixed code, and explain the change.`;

export const SYSTEM_REFACTOR = `You are a code refactoring expert. Improve code quality without changing functionality.
Focus on: readability, maintainability, performance, language idioms, and design patterns.
Always provide the refactored version with brief comments explaining improvements.`;

export function buildExplainPrompt(code: string, language: string, filename?: string): string {
  return `Please explain the following ${language} code${filename ? ` from \`${filename}\`` : ""}:\n\n\`\`\`${language}\n${code}\n\`\`\``;
}

export function buildFixPrompt(code: string, language: string, error?: string): string {
  if (error) {
    return `Fix the following ${language} code that has this error:\n\n**Error:** ${error}\n\n\`\`\`${language}\n${code}\n\`\`\``;
  }
  return `Find and fix any bugs in the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
}

export function buildRefactorPrompt(code: string, language: string): string {
  return `Refactor the following ${language} code to improve quality:\n\n\`\`\`${language}\n${code}\n\`\`\``;
}

export function buildGeneratePrompt(
  description: string,
  language: string,
  context?: string
): string {
  const ctx = context
    ? `\n\nContext from current file:\n\`\`\`${language}\n${context}\n\`\`\``
    : "";
  return `Generate ${language} code for: ${description}${ctx}\n\nProvide complete, working code.`;
}

export function buildDocumentPrompt(code: string, language: string): string {
  return `Add comprehensive documentation/comments to the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
}

export function buildTestPrompt(code: string, language: string): string {
  return `Write unit tests for the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
}
