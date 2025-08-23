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
  title = "Mehrere Aufgaben auf einmal hinzufügen",
  description = "Fügt Aufgaben per Text (eine Zeile = eine Aufgabe) oder ladet eine .txt‑Datei hoch."
}: BulkPromptsDialogProps) {
  
  const handleSubmit = () => {
    if (parsedPrompts.length > 0) {
      onSubmit(parsedPrompts)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file && file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = (e.target?.result as string) || ''
        onBulkTextChange(content)
      }
      reader.readAsText(file)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && (
        <DialogTrigger asChild>
          {triggerButton}
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Dropzone / File Upload */}
          <div
            className="relative rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <label className="flex flex-col items-center justify-center text-center p-6 cursor-pointer">
              <Upload className="w-6 h-6 text-stone-500 mb-2" />
              <span className="text-sm font-medium text-stone-800">.txt‑Datei hierher ziehen oder klicken</span>
              <span className="text-xs text-stone-600 mt-1">Jede Zeile wird zu einer Aufgabe</span>
              <input
                type="file"
                accept=".txt"
                onChange={onFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label=".txt-Datei mit Aufgaben hochladen"
              />
            </label>
          </div>

          {/* Text Input */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="block text-sm font-medium text-stone-800">
                Oder Text direkt einfügen
              </label>
              <span className="text-xs text-stone-500">
                {parsedPrompts.length} erkannte Aufgaben
              </span>
            </div>
            <textarea
              value={bulkText}
              onChange={(e) => onBulkTextChange(e.target.value)}
              placeholder="Eine Aufgabe pro Zeile\nZum Beispiel:\nEin Foto mit dem Brautpaar\nEin Bild von der Torte\nEin lustiges Gruppenfoto"
              rows={8}
              className="w-full px-3 py-2 ring-1 ring-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2 focus:ring-offset-white text-sm bg-white resize-y appearance-none"
              aria-describedby="bulk-text-help"
            />
            <p id="bulk-text-help" className="mt-1 text-xs text-stone-600">
              Duplizierte oder leere Zeilen werden automatisch entfernt.
            </p>
          </div>

          {/* Preview */}
          {bulkText.trim() && (
            <div className="p-3 bg-stone-50 rounded-xl ring-1 ring-stone-200/70">
              <p className="text-sm text-stone-800 mb-2">
                Vorschau ({parsedPrompts.length}):
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {parsedPrompts.map((prompt, index) => (
                  <div key={index} className="text-xs text-stone-700 truncate">
                    {index + 1}. {prompt}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className={`p-3 rounded-xl ring-1 ${
              results.errors.length > 0 || (results.duplicates?.length || 0) > 0 ? 'bg-amber-50 ring-amber-200' : 'bg-green-50 ring-green-200'
            }`}>
              <p className="text-sm font-medium text-stone-900">
                {results.added} von {results.total} Aufgaben erfolgreich hinzugefügt
              </p>
              {(results.duplicatesExisting?.length || results.duplicatesWithin?.length || results.skippedUnknown) ? (
                <p className="text-xs text-stone-700 mt-0.5">
                  Übersprungen: {(results.duplicatesExisting?.length || 0) + (results.duplicatesWithin?.length || 0) + (results.skippedUnknown || 0)}
                  {results.duplicatesExisting && results.duplicatesExisting.length > 0 && ` (bereits vorhanden: ${results.duplicatesExisting.length})`}
                  {results.duplicatesWithin && results.duplicatesWithin.length > 0 && ` (in dieser Liste doppelt: ${results.duplicatesWithin.length})`}
                  {results.skippedUnknown ? ` (serverseitig übersprungen: ${results.skippedUnknown})` : ''}
                </p>
              ) : (results.duplicates && results.duplicates.length > 0 ? (
                <p className="text-xs text-stone-700 mt-0.5">Übersprungen: {results.duplicates.length} Duplikate</p>
              ) : null)}

              {/* Existing duplicates (server state) */}
              {results.duplicatesExisting && results.duplicatesExisting.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-amber-800 font-medium">Bereits vorhandene Aufgaben übersprungen:</p>
                  <div className="text-xs text-amber-700 space-y-1 mt-1">
                    {results.duplicatesExisting.map((duplicate, index) => (
                      <div key={index} className="truncate">• {duplicate}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Within-list duplicates */}
              {results.duplicatesWithin && results.duplicatesWithin.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-amber-800 font-medium">Doppelte Einträge in eurer Liste:</p>
                  <div className="text-xs text-amber-700 space-y-1 mt-1">
                    {results.duplicatesWithin.map((duplicate, index) => (
                      <div key={index} className="truncate">• {duplicate}</div>
                    ))}
                  </div>
                </div>
              )}

              {results.errors.length > 0 && (
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-red-800 font-medium">Fehler:</p>
                  {results.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-700">
                      Zeile {error.index + 1}: {error.error}
                    </p>
                  ))}
                </div>
              )}

              {results.skippedUnknown ? (
                <p className="text-xs text-stone-700 mt-2">
                  Hinweis: Einige Einträge wurden vom Server nicht übernommen. Versucht es erneut oder prüft die Eingaben.
                </p>
              ) : null}
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
      className="gap-2 h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm max-w-full" 
      onClick={onClick}
      aria-label="Mehrere Aufgaben hinzufügen"
    >
      <Upload className="w-4 h-4" />
      <span className="hidden sm:inline">Mehrere Aufgaben hinzufügen</span>
    </Button>
  )
}