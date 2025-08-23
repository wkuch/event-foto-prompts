/**
 * Utility functions for prompt processing and validation
 */

export interface ParsedPrompt {
  text: string
  index: number
}

export interface PromptValidationError {
  index: number
  text: string
  error: string
}

/**
 * Parse prompts from text input, splitting by newlines and filtering empty lines
 */
export function parsePromptsFromText(text: string): ParsedPrompt[] {
  return text
    .split('\n')
    .map((line, index) => ({ text: line.trim(), index }))
    .filter(prompt => prompt.text.length > 0)
}

/**
 * Validate prompts and return errors for invalid ones
 */
export function validatePrompts(prompts: ParsedPrompt[], maxLength: number = 500): PromptValidationError[] {
  const errors: PromptValidationError[] = []

  prompts.forEach(prompt => {
    if (prompt.text.length === 0) {
      errors.push({
        index: prompt.index,
        text: prompt.text,
        error: 'Prompt text is required'
      })
    } else if (prompt.text.length > maxLength) {
      errors.push({
        index: prompt.index,
        text: prompt.text,
        error: `Prompt text too long (max ${maxLength} characters)`
      })
    }
  })

  return errors
}

/**
 * Remove duplicate prompts from an array
 */
export function deduplicatePrompts(prompts: string[], existingPrompts: string[] = []): string[] {
  const allPrompts = [...existingPrompts, ...prompts]
  const seen = new Set<string>()
  const deduplicated: string[] = []

  prompts.forEach(prompt => {
    const normalizedPrompt = prompt.trim().toLowerCase()
    if (!seen.has(normalizedPrompt)) {
      seen.add(normalizedPrompt)
      deduplicated.push(prompt)
    }
  })

  return deduplicated
}

/**
 * Check if a prompt already exists in the list (case-insensitive)
 */
export function promptExists(prompt: string, existingPrompts: string[]): boolean {
  const normalizedPrompt = prompt.trim().toLowerCase()
  return existingPrompts.some(existing => existing.trim().toLowerCase() === normalizedPrompt)
}

/**
 * Sanitize and clean prompt text
 */
export function sanitizePromptText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Generate preview text for bulk prompts
 */
export function generatePreviewText(prompts: string[], maxItems: number = 10): string {
  if (prompts.length === 0) return 'Keine Aufgaben gefunden'
  
  const preview = prompts.slice(0, maxItems)
  const remaining = prompts.length - maxItems
  
  let text = preview.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n')
  
  if (remaining > 0) {
    text += `\n... und ${remaining} weitere`
  }
  
  return text
}