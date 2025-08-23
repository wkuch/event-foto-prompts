import { useState, useCallback } from 'react'
import { parsePromptsFromText, deduplicatePrompts, sanitizePromptText } from '@/lib/prompt-utils'

export interface BulkPromptResults {
  added: number
  total: number
  errors: Array<{
    index: number
    text: string
    error: string
  }>
  duplicates: string[]
}

interface UseBulkPromptsProps {
  existingPrompts?: string[]
  onPromptsAdded?: (newPrompts: string[]) => void
  onError?: (error: string) => void
}

export function useBulkPrompts({ 
  existingPrompts = [], 
  onPromptsAdded,
  onError 
}: UseBulkPromptsProps = {}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<BulkPromptResults | null>(null)

  const parsedPrompts = parsePromptsFromText(bulkText)
  const promptTexts = parsedPrompts.map(p => sanitizePromptText(p.text))

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setBulkText(content)
      }
      reader.readAsText(file)
    } else if (file) {
      onError?.('Bitte wählen Sie eine .txt-Datei aus')
    }
  }, [onError])

  const processBulkPrompts = useCallback((prompts: string[]) => {
    setIsProcessing(true)
    setResults(null)

    try {
      // Clean and validate prompts
      const cleanedPrompts = prompts.map(sanitizePromptText).filter(p => p.length > 0)
      
      // Check for duplicates
      const duplicates: string[] = []
      const newPrompts: string[] = []
      
      cleanedPrompts.forEach(prompt => {
        if (existingPrompts.some(existing => existing.toLowerCase() === prompt.toLowerCase())) {
          duplicates.push(prompt)
        } else {
          newPrompts.push(prompt)
        }
      })

      // Deduplicate new prompts
      const deduplicatedPrompts = deduplicatePrompts(newPrompts)

      const results: BulkPromptResults = {
        added: deduplicatedPrompts.length,
        total: prompts.length,
        errors: [],
        duplicates
      }

      setResults(results)

      if (deduplicatedPrompts.length > 0) {
        onPromptsAdded?.(deduplicatedPrompts)
      }

      // Clear text if all prompts were added successfully
      if (results.errors.length === 0 && duplicates.length === 0) {
        setBulkText('')
      }

    } catch (error) {
      onError?.('Fehler beim Verarbeiten der Aufgaben')
    } finally {
      setIsProcessing(false)
    }
  }, [existingPrompts, onPromptsAdded, onError])

  const resetDialog = useCallback(() => {
    setBulkText('')
    setResults(null)
    setIsProcessing(false)
  }, [])

  const openDialog = useCallback(() => {
    setIsDialogOpen(true)
    resetDialog()
  }, [resetDialog])

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
    resetDialog()
  }, [resetDialog])

  return {
    // State
    isDialogOpen,
    bulkText,
    isProcessing,
    results,
    parsedPrompts: promptTexts,
    
    // Actions
    setBulkText,
    handleFileUpload,
    processBulkPrompts,
    openDialog,
    closeDialog,
    resetDialog
  }
}