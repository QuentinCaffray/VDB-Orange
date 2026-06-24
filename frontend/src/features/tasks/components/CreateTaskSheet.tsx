import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateTask } from '../hooks/useTasks'

const createTaskFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(100, 'Titre trop long'),
  description: z.string().max(500).optional(),
  dueDate: z.string().optional(),
})

type CreateTaskFormValues = z.infer<typeof createTaskFormSchema>

interface CreateTaskSheetProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateTaskSheet({ isOpen, onClose }: CreateTaskSheetProps) {
  const { mutate: createTask, isPending } = useCreateTask()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskFormSchema),
  })

  function handleFormSubmit(formValues: CreateTaskFormValues): void {
    createTask(
      {
        title: formValues.title,
        description: formValues.description || undefined,
        dueDate: formValues.dueDate || undefined,
      },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )
  }

  function handleClose(): void {
    reset()
    onClose()
  }

  if (!isOpen) return null

  // Portal vers document.body pour échapper au overflow-y:auto du PageWrapper
  // Sans ça, position:fixed se positionne par rapport au scroll container et non au viewport
  return createPortal(
    <div
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={handleClose}
    >
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: '85svh' }}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header non-scrollable */}
        <div className="px-6 pt-6 pb-3 shrink-0 flex flex-col gap-3">
          <div className="w-10 h-1 rounded-full bg-border mx-auto" />
          <h2 className="font-display text-2xl font-semibold text-text-primary">
            Nouvelle tâche
          </h2>
        </div>

        {/* Champs scrollables */}
        <form
          id="create-task-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          className="px-6 overflow-y-auto flex-1 min-h-0 flex flex-col gap-4 pb-2"
        >

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold tracking-widest uppercase text-text-secondary">
              Titre
            </label>
            <input
              {...register('title')}
              placeholder="Ex: Réorganiser les accessoires"
              className={`w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none bg-surface text-text-primary border-[1.5px] ${errors.title ? 'border-danger' : 'border-transparent'}`}
            />
            {errors.title && (
              <p className="text-xs font-semibold text-danger m-0">{errors.title.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold tracking-widest uppercase text-text-secondary">
              Description <span className="normal-case font-normal">(optionnel)</span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Détails supplémentaires…"
              rows={2}
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none bg-surface text-text-primary border-[1.5px] border-transparent resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold tracking-widest uppercase text-text-secondary">
              Date limite <span className="normal-case font-normal">(optionnel)</span>
            </label>
            <input
              {...register('dueDate')}
              type="date"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none bg-surface text-text-primary border-[1.5px] border-transparent"
            />
          </div>

        </form>

        {/* Footer non-scrollable */}
        <div
          className="px-6 pt-3 shrink-0 flex gap-3"
          style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-4 rounded-2xl bg-surface text-text-secondary font-bold text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="create-task-form"
            disabled={isPending}
            className="flex-1 py-4 rounded-2xl bg-brand text-white font-bold text-sm shadow-[0_8px_18px_rgba(255,121,0,0.3)] disabled:opacity-70"
          >
            {isPending ? 'Création…' : 'Créer la tâche'}
          </button>
        </div>

      </div>
    </div>,
    document.body,
  )
}
