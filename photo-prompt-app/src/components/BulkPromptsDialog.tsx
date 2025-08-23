import { Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { BulkPromptResults } from '@/hooks/useBulkPrompts'

interface BulkPromptsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  bulkText: string
  onBulkTextChange: (text: string) => void
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  parsedPrompts: string[]
  isProcessing: boolean
  results: BulkPromptResults | null
  onSubmit: (prompts: string[]) => void
  triggerButton?: React.ReactNode
  title?: string
  description?: string
}

export function BulkPromptsDialog({
  isOpen,
  onOpenChange,
  bulkText,
  onBulkTextChange,
  onFileUpload,
  parsedPrompts,
  isProcessing,
  results,
  onSubmit,
  triggerButton,
  title = "Aufgaben in großer Menge hinzufügen",
  description = "Laden Sie eine Textdatei hoch oder fügen Sie Text ein. Jede Zeile wird zu einer neuen Aufgabe."
}: BulkPromptsDialogProps) {
  
  const handleSubmit = () => {
    if (parsedPrompts.length > 0) {
      onSubmit(parsedPrompts)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && (
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-stone-800 mb-2">
              Textdatei hochladen (.txt)
            </label>
            <input
              type="file"
              accept=".txt"
              onChange={onFileUpload}
              className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-stone-50 file:text-stone-700 hover:file:bg-stone-100"
            />
          </div>
          
          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-stone-800 mb-2">
              Oder Text direkt eingeben
            </label>
            <textarea
              value={bulkText}
              onChange={(e) => onBulkTextChange(e.target.value)}
              placeholder="Eine Aufgabe pro Zeile&#10;Zum Beispiel:&#10;Ein Foto mit dem Brautpaar&#10;Ein Bild von der Torte&#10;Ein lustiges Gruppenfoto"
              rows={8}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
            />
          </div>

          {/* Preview */}
          {bulkText.trim() && (
            <div className="p-3 bg-stone-50 rounded-lg">
              <p className="text-sm text-stone-700 mb-2">
                <strong>{parsedPrompts.length} Aufgaben</strong> werden hinzugefügt:
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {parsedPrompts.map((prompt, index) => (
                  <div key={index} className="text-xs text-stone-600 truncate">
                    {index + 1}. {prompt}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className={`p-3 rounded-lg ${
              results.errors.length > 0 || results.duplicates.length > 0 ? 'bg-yellow-50' : 'bg-green-50'
            }`}>
              <p className="text-sm font-medium mb-2">
                {results.added} von {results.total} Aufgaben erfolgreich hinzugefügt
              </p>
              
              {results.duplicates.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-amber-800 font-medium">
                    {results.duplicates.length} bereits vorhandene Aufgaben übersprungen:
                  </p>
                  <div className="text-xs text-amber-700 space-y-1 mt-1">
                    {results.duplicates.map((duplicate, index) => (
                      <div key={index} className="truncate">• {duplicate}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {results.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-red-800 font-medium">Fehler:</p>
                  {results.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600">
                      Zeile {error.index + 1}: {error.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!bulkText.trim() || isProcessing || parsedPrompts.length === 0}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Wird hinzugefügt...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  {parsedPrompts.length} Aufgaben hinzufügen
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Default trigger button component
export function BulkPromptsTrigger({ onClick }: { onClick?: () => void }) {
  return (
    <Button 
      type="button" 
      variant="outline" 
      size="sm" 
      className="gap-2" 
      onClick={onClick}
    >
      <Upload className="w-4 h-4" />
      Mehrere Aufgaben hinzufügen
    </Button>
  )
}