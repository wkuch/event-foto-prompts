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
  // Back-compat combined list (existing + within-list)
  duplicates: string[]
  // New fields for clearer UX
  duplicatesExisting?: string[]
  duplicatesWithin?: string[]
  createdByServer?: number
  skippedUnknown?: number
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
      const cleanedPrompts = prompts.map(sanitizePromptText)

      const errors: BulkPromptResults["errors"] = []
      const duplicatesExisting: string[] = []
      const duplicatesWithin: string[] = []
      const newPrompts: string[] = []
      const seenInBatch = new Set<string>()

      cleanedPrompts.forEach((prompt, index) => {
        const normalized = prompt.toLowerCase()

        // Basic validations
        if (normalized.length === 0) {
          errors.push({ index, text: prompt, error: 'Leerzeile (keine Aufgabe)' })
          return
        }
        if (prompt.length > 500) {
          errors.push({ index, text: prompt, error: 'Zu lang (max. 500 Zeichen)' })
          return
        }

        // Check if already exists in existing prompts
        if (existingPrompts.some(existing => sanitizePromptText(existing).toLowerCase() === normalized)) {
          duplicatesExisting.push(prompt)
          return
        }

        // Check duplicates within the submitted list
        if (seenInBatch.has(normalized)) {
          duplicatesWithin.push(prompt)
          return
        }

        seenInBatch.add(normalized)
        newPrompts.push(prompt)
      })

      // Deduplicate new prompts just in case (should already be unique)
      const deduplicatedPrompts = deduplicatePrompts(newPrompts)

      const combinedDuplicates = [...duplicatesExisting, ...duplicatesWithin]

      const results: BulkPromptResults = {
        added: deduplicatedPrompts.length,
        total: prompts.length,
        errors,
        duplicates: combinedDuplicates,
        duplicatesExisting,
        duplicatesWithin
      }

      setResults(results)

      if (deduplicatedPrompts.length > 0) {
        onPromptsAdded?.(deduplicatedPrompts)
      }

      // Clear text if everything added and no issues
      if (errors.length === 0 && combinedDuplicates.length === 0) {
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

  const applyServerResults = useCallback((createdCount: number, serverDuplicatesExisting: string[] = []) => {
    setResults(prev => {
      if (!prev) return prev
      const serverAdjustedAdded = createdCount
      const serverDupCount = serverDuplicatesExisting.length
      const clientPlannedAdds = prev.added
      const unknownSkips = Math.max(0, clientPlannedAdds - serverAdjustedAdded - serverDupCount)
      return {
        ...prev,
        added: serverAdjustedAdded,
        createdByServer: createdCount,
        duplicatesExisting: [...(prev.duplicatesExisting || []), ...serverDuplicatesExisting],
        duplicates: [...prev.duplicates, ...serverDuplicatesExisting],
        skippedUnknown: unknownSkips
      }
    })
  }, [])

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
    resetDialog,
    applyServerResults
  }
}