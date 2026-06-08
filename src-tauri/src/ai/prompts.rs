/// Build a chat prompt using ChatML format (used by Qwen, DeepSeek, Phi)
pub fn build_chatml_prompt(system: &str, messages: &[(&str, &str)]) -> String {
    let mut prompt = format!("<|im_start|>system\n{}<|im_end|>\n", system);

    for (role, content) in messages {
        prompt.push_str(&format!(
            "<|im_start|>{}\n{}<|im_end|>\n",
            role, content
        ));
    }

    prompt.push_str("<|im_start|>assistant\n");
    prompt
}

/// Build a prompt using Phi-3 format
pub fn build_phi3_prompt(system: &str, user_message: &str) -> String {
    format!(
        "<|system|>\n{}<|end|>\n<|user|>\n{}<|end|>\n<|assistant|>\n",
        system, user_message
    )
}

pub const SYSTEM_CODING_ASSISTANT: &str = r#"You are FluxIDE's AI coding assistant — an expert programmer with deep knowledge across all programming languages, frameworks, and software engineering principles.

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
- Suggest best practices and explain why when relevant"#;

pub const SYSTEM_CODE_EXPLAINER: &str = r#"You are a code explanation expert. Your role is to explain code clearly and educationally.
Break down complex logic into understandable parts. Use analogies when helpful.
Format your response with sections: Overview, Key Concepts, Line-by-Line (if needed), and Summary."#;

pub const SYSTEM_BUG_FIXER: &str = r#"You are a debugging expert. Analyze the provided code for bugs, errors, and issues.
For each issue found:
1. Identify the problem clearly
2. Explain why it's a bug
3. Provide the fixed code
4. Explain what was changed and why"#;

pub const SYSTEM_REFACTOR: &str = r#"You are a code refactoring expert. Your goal is to improve code quality without changing functionality.
Focus on: readability, maintainability, performance, following language idioms, and design patterns.
Always provide the refactored version with comments explaining the improvements."#;

pub fn build_explain_prompt(code: &str, language: &str) -> String {
    format!(
        "Please explain the following {} code:\n\n```{}\n{}\n```",
        language, language, code
    )
}

pub fn build_fix_prompt(code: &str, language: &str, error: Option<&str>) -> String {
    if let Some(err) = error {
        format!(
            "Fix the following {} code that has this error:\n\nError: {}\n\nCode:\n```{}\n{}\n```",
            language, err, language, code
        )
    } else {
        format!(
            "Find and fix any bugs in the following {} code:\n\n```{}\n{}\n```",
            language, language, code
        )
    }
}

pub fn build_refactor_prompt(code: &str, language: &str) -> String {
    format!(
        "Refactor the following {} code to improve quality:\n\n```{}\n{}\n```",
        language, language, code
    )
}

pub fn build_generate_prompt(description: &str, language: &str, context: Option<&str>) -> String {
    let ctx = context
        .map(|c| format!("\n\nContext from current file:\n```{}\n{}\n```", language, c))
        .unwrap_or_default();

    format!(
        "Generate {} code for: {}{}\n\nProvide complete, working code.",
        language, description, ctx
    )
}
