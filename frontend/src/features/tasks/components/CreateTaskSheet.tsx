import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateTask } from '../hooks/useTasks'

const createTaskFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(100, 'Titre trop long'),
  description: z.string().max(500).optional(),
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
      { title: formValues.title, description: formValues.description || undefined },
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

  return (
    // Overlay assombri
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={handleClose}
    >
      {/* Feuille — stoppe la propagation du clic pour ne pas fermer en cliquant dedans */}
      <div
        className="w-full max-w-[480px] bg-white rounded-t-3xl px-6 pt-6 pb-10 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignée visuelle */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto" />

        <h2 className="font-display text-2xl font-semibold text-text-primary">
          Nouvelle tâche
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">

          {/* Titre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold tracking-widest uppercase text-text-secondary">
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

          {/* Description (optionnel) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold tracking-widest uppercase text-text-secondary">
              Description <span className="normal-case font-normal">(optionnel)</span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Détails supplémentaires…"
              rows={3}
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none bg-surface text-text-primary border-[1.5px] border-transparent resize-none"
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-4 rounded-2xl bg-surface text-text-secondary font-bold text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-4 rounded-2xl bg-brand text-white font-bold text-sm shadow-[0_8px_18px_rgba(255,121,0,0.3)] disabled:opacity-70"
            >
              {isPending ? 'Création…' : 'Créer la tâche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
