import { useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import {
  useActiveGame,
  useCreateGame,
  usePauseGame,
  useResumeGame,
  useResetGame,
  useFinishGame,
  useAdminAdvancePawn,
  useSubmitMoveRequest,
  usePendingMoveRequests,
  useResolveMoveRequest,
} from '../../features/game/hooks/useGame'
import { ActiveGame, GamePawn, MoveRequest } from '../../types/game.types'
import { Skeleton } from '../../components/ui/Skeleton'

export default function GamePage() {
  const { currentUser } = useAuthContext()
  const isAdmin = currentUser?.role === 'admin'
  const { data: activeGame, isLoading } = useActiveGame()

  if (isLoading) {
    return <GameSkeleton />
  }

  const isGameVisibleToVendor = activeGame && activeGame.status !== 'finished'

  if (!activeGame || (!isAdmin && !isGameVisibleToVendor)) {
    return <NoGameView isAdmin={isAdmin} />
  }

  return <ActiveGameView game={activeGame} isAdmin={isAdmin} currentUserId={currentUser?.id ?? ''} />
}

// ── No game ───────────────────────────────────────────────────────────────────

interface NoGameViewProps {
  isAdmin: boolean
}

function NoGameView({ isAdmin }: NoGameViewProps) {
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-6">
        <BuildingIcon />
        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', textAlign: 'center' }}>
          Aucune partie en cours
        </p>
        <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
          L'admin lancera une partie prochainement
        </p>
      </div>
    )
  }
  return <CreateGameForm />
}

function CreateGameForm() {
  const [floorCount, setFloorCount] = useState(10)
  const [objective, setObjective] = useState('')
  const [reward, setReward] = useState('')
  const { mutate: createGame, isPending } = useCreateGame()

  const canSubmit = objective.trim() && reward.trim()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    createGame({ floorCount, objective: objective.trim(), reward: reward.trim() })
  }

  return (
    <div className="px-4 pt-6 pb-8 max-w-[430px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BuildingIcon />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Gratte-ciel
          </h1>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>
            Créer une nouvelle partie
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Nombre d'étages
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFloorCount((prev) => Math.max(3, prev - 1))}
              style={stepperButtonStyle}
            >
              −
            </button>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', minWidth: 40, textAlign: 'center' }}>
              {floorCount}
            </span>
            <button
              type="button"
              onClick={() => setFloorCount((prev) => Math.min(30, prev + 1))}
              style={stepperButtonStyle}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Objectif pour avancer
          </label>
          <input
            type="text"
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            placeholder="Ex: Vendre un smartphone haut de gamme"
            required
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: 14,
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Récompense du gagnant
          </label>
          <input
            type="text"
            value={reward}
            onChange={(event) => setReward(event.target.value)}
            placeholder="Ex: Pizzas pour tout le monde"
            required
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              fontSize: 14,
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !canSubmit}
          style={{
            marginTop: 8,
            padding: '14px',
            borderRadius: 14,
            background: isPending || !canSubmit ? 'var(--color-border)' : '#FF7900',
            color: 'white',
            fontWeight: 700,
            fontSize: 15,
            border: 'none',
            cursor: isPending || !canSubmit ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'Création...' : 'Lancer la partie'}
        </button>
      </form>
    </div>
  )
}

const stepperButtonStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-surface)',
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

// ── Active game ───────────────────────────────────────────────────────────────

interface ActiveGameViewProps {
  game: ActiveGame
  isAdmin: boolean
  currentUserId: string
}

function ActiveGameView({ game, isAdmin, currentUserId }: ActiveGameViewProps) {
  return (
    <div className="px-4 pt-6 pb-8 max-w-[430px] mx-auto flex flex-col gap-5">
      <GameHeader game={game} isAdmin={isAdmin} />
      <GameBuilding game={game} currentUserId={currentUserId} />
      {isAdmin && <AdminControls game={game} currentUserId={currentUserId} />}
      {!isAdmin && game.status === 'active' && (
        <VendorRequestPanel gameId={game.id} />
      )}
    </div>
  )
}

interface GameHeaderProps {
  game: ActiveGame
  isAdmin: boolean
}

function GameHeader({ game, isAdmin }: GameHeaderProps) {
  const statusLabel: Record<ActiveGame['status'], string> = {
    active: 'En cours',
    paused: 'Pause',
    finished: 'Terminée',
  }
  const statusColor: Record<ActiveGame['status'], string> = {
    active: '#22c55e',
    paused: '#f59e0b',
    finished: '#6b7280',
  }

  const highestFloor = game.pawns.length > 0
    ? Math.max(...game.pawns.map((pawn) => pawn.currentFloor))
    : 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BuildingIcon />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Gratte-ciel
          </h1>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--color-text-tertiary)',
            background: 'var(--color-surface)',
            padding: '3px 8px',
            borderRadius: 20,
          }}>
            🏢 {highestFloor}/{game.floorCount}
          </span>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: statusColor[game.status],
          background: `${statusColor[game.status]}22`,
          padding: '3px 10px',
          borderRadius: 20,
        }}>
          {statusLabel[game.status]}
        </span>
      </div>

      {/* Objectif + Récompense — visible par tous */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1.5px solid var(--color-border-soft)',
            borderRadius: 14,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>🎯</span>
          <div>
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pour avancer d'un étage
            </p>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text-primary)', margin: '2px 0 0' }}>
              {game.objective}
            </p>
          </div>
        </div>
        <div
          style={{
            background: 'linear-gradient(135deg, #FF790015 0%, #FFB30015 100%)',
            border: '1.5px solid #FF790030',
            borderRadius: 14,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>🏆</span>
          <div>
            <p style={{ fontSize: 11, color: '#FF7900', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Récompense du gagnant
            </p>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text-primary)', margin: '2px 0 0' }}>
              {game.reward}
            </p>
          </div>
        </div>
      </div>

      {game.winnerId && game.winnerName && (
        <div
          style={{
            background: game.status === 'finished' ? '#FF790015' : '#f59e0b15',
            border: `1.5px solid ${game.status === 'finished' ? '#FF790040' : '#f59e0b40'}`,
            borderRadius: 14,
            padding: '14px 16px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 24, margin: 0 }}>{game.status === 'finished' ? '🎉' : '🏆'}</p>
          <p style={{ fontSize: 17, fontWeight: 800, color: game.status === 'finished' ? '#FF7900' : '#f59e0b', margin: '4px 0 2px' }}>
            {game.winnerName} {game.status === 'finished' ? 'a gagné !' : 'a atteint le sommet !'}
          </p>
          {game.status === 'paused' && isAdmin && (
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              En attente de validation — clique sur "Terminer" pour officialiser
            </p>
          )}
        </div>
      )}

      {isAdmin && game.status !== 'finished' && game.pendingRequestCount > 0 && (
        <div
          style={{
            background: '#f59e0b15',
            border: '1.5px solid #f59e0b40',
            borderRadius: 12,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: '#f59e0b',
          }}
        >
          {game.pendingRequestCount} demande{game.pendingRequestCount > 1 ? 's' : ''} en attente de modération
        </div>
      )}
    </div>
  )
}

// ── Building visual ───────────────────────────────────────────────────────────

interface GameBuildingProps {
  game: ActiveGame
  currentUserId: string
}

function GameBuilding({ game, currentUserId }: GameBuildingProps) {
  const floors = buildFloorMap(game.pawns, game.floorCount)

  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid var(--color-border-soft)',
        overflow: 'hidden',
      }}
    >
      <FloorRow
        floorNumber={game.floorCount}
        isGoal={true}
        pawns={floors[game.floorCount] ?? []}
        currentUserId={currentUserId}
      />
      {Array.from({ length: game.floorCount - 1 }, (_, index) => {
        const floorNumber = game.floorCount - 1 - index
        return (
          <FloorRow
            key={floorNumber}
            floorNumber={floorNumber}
            isGoal={false}
            pawns={floors[floorNumber] ?? []}
            currentUserId={currentUserId}
          />
        )
      })}
      <FloorRow
        floorNumber={0}
        isGoal={false}
        isGround={true}
        pawns={floors[0] ?? []}
        currentUserId={currentUserId}
      />
    </div>
  )
}

function buildFloorMap(
  pawns: GamePawn[],
  floorCount: number,
): Record<number, GamePawn[]> {
  const floorMap: Record<number, GamePawn[]> = {}
  for (let floorIndex = 0; floorIndex <= floorCount; floorIndex++) {
    floorMap[floorIndex] = []
  }
  for (const pawn of pawns) {
    const clampedFloor = Math.min(pawn.currentFloor, floorCount)
    floorMap[clampedFloor].push(pawn)
  }
  return floorMap
}

interface FloorRowProps {
  floorNumber: number
  isGoal: boolean
  isGround?: boolean
  pawns: GamePawn[]
  currentUserId: string
}

function FloorRow({ floorNumber, isGoal, isGround, pawns, currentUserId }: FloorRowProps) {
  const hasPawns = pawns.length > 0

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '1px solid var(--color-border-soft)',
        minHeight: 52,
      }}
    >
      {/* Numéro de l'étage */}
      <div
        style={{
          width: 40,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid var(--color-border-soft)',
          background: isGoal
            ? 'linear-gradient(180deg, #FFB300 0%, #FF7900 100%)'
            : isGround
            ? 'var(--color-surface)'
            : 'var(--color-card)',
        }}
      >
        {isGoal ? (
          <span style={{ fontSize: 16 }}>🏆</span>
        ) : (
          <span style={{ fontSize: isGround ? 9 : 11, fontWeight: 800, color: 'var(--color-text-tertiary)' }}>
            {isGround ? 'Sol' : floorNumber}
          </span>
        )}
      </div>

      {/* Contenu de l'étage */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          gap: 8,
          flexWrap: 'wrap',
          background: isGoal
            ? '#FF790008'
            : isGround
            ? 'var(--color-surface)'
            : hasPawns
            ? 'var(--color-brand-tint)'
            : 'var(--color-card)',
        }}
      >
        {isGoal && !hasPawns && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FF7900', opacity: 0.6 }}>
            Arrivée
          </span>
        )}

        {!hasPawns && !isGoal && (
          <div style={{ display: 'flex', gap: 5, opacity: 0.12 }}>
            {[0, 1, 2, 3].map((windowIndex) => (
              <div
                key={windowIndex}
                style={{ width: 9, height: 12, borderRadius: 2, background: 'var(--color-text-secondary)' }}
              />
            ))}
          </div>
        )}

        {hasPawns && pawns.map((pawn) => (
          <PawnOnFloor
            key={pawn.id}
            pawn={pawn}
            isCurrentUser={pawn.userId === currentUserId}
          />
        ))}
      </div>
    </div>
  )
}

interface PawnOnFloorProps {
  pawn: GamePawn
  isCurrentUser: boolean
}

function PawnOnFloor({ pawn, isCurrentUser }: PawnOnFloorProps) {
  const firstName = pawn.userName.split(' ')[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: pawn.userColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isCurrentUser
            ? `0 0 0 2px white, 0 0 0 3.5px ${pawn.userColor}`
            : '0 1px 4px rgba(0,0,0,0.18)',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 900, color: 'white' }}>
          {pawn.userName.charAt(0).toUpperCase()}
        </span>
      </div>
      <span
        style={{
          fontSize: 9,
          fontWeight: isCurrentUser ? 800 : 600,
          color: isCurrentUser ? pawn.userColor : 'var(--color-text-secondary)',
          lineHeight: 1,
          maxWidth: 36,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {firstName}
      </span>
    </div>
  )
}

// ── Admin controls ────────────────────────────────────────────────────────────

interface AdminControlsProps {
  game: ActiveGame
  currentUserId: string
}

function AdminControls({ game, currentUserId }: AdminControlsProps) {
  const [showNewGameForm, setShowNewGameForm] = useState(false)
  const [newFloorCount, setNewFloorCount] = useState(game.floorCount)
  const [newObjective, setNewObjective] = useState('')
  const [newReward, setNewReward] = useState('')
  const { mutate: pauseGame, isPending: isPausing } = usePauseGame()
  const { mutate: resumeGame, isPending: isResuming } = useResumeGame()
  const { mutate: resetGame, isPending: isResetting } = useResetGame()
  const { mutate: finishGame, isPending: isFinishing } = useFinishGame()
  const { mutate: createGame, isPending: isCreatingNewGame } = useCreateGame()
  const { mutate: adminAdvance, isPending: isAdvancing } = useAdminAdvancePawn()
  const { data: pendingRequests = [], isLoading: isLoadingRequests } = usePendingMoveRequests(game.id)
  const { mutate: resolveRequest, isPending: isResolving } = useResolveMoveRequest(game.id)

  const isGameActive = game.status === 'active'
  const isGamePaused = game.status === 'paused'
  const isGameFinished = game.status === 'finished'
  const myPawn = game.pawns.find((pawn) => pawn.userId === currentUserId)

  function handleCreateNewGame(event: React.FormEvent) {
    event.preventDefault()
    if (!newObjective.trim() || !newReward.trim()) return
    createGame(
      { floorCount: newFloorCount, objective: newObjective.trim(), reward: newReward.trim() },
      {
        onSuccess: () => {
          setShowNewGameForm(false)
          setNewObjective('')
          setNewReward('')
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Nouvelle partie — formulaire inline quand la partie est terminée */}
      {isGameFinished && (
        <div style={adminCardStyle}>
          <p style={adminCardTitleStyle}>Partie terminée</p>
          {!showNewGameForm ? (
            <button onClick={() => setShowNewGameForm(true)} style={primaryButtonStyle}>
              Lancer une nouvelle partie
            </button>
          ) : (
            <form onSubmit={handleCreateNewGame} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Nombre d'étages</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setNewFloorCount((v) => Math.max(3, v - 1))} style={stepperButtonStyle}>−</button>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)', minWidth: 32, textAlign: 'center' }}>{newFloorCount}</span>
                  <button type="button" onClick={() => setNewFloorCount((v) => Math.min(30, v + 1))} style={stepperButtonStyle}>+</button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Objectif pour avancer</label>
                <input type="text" value={newObjective} onChange={(e) => setNewObjective(e.target.value)} placeholder="Ex: Vendre un smartphone haut de gamme" required style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', fontSize: 13, color: 'var(--color-text-primary)', outline: 'none' }} />
              </div>
              <div className="flex flex-col gap-1">
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Récompense du gagnant</label>
                <input type="text" value={newReward} onChange={(e) => setNewReward(e.target.value)} placeholder="Ex: Pizzas pour tout le monde" required style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', fontSize: 13, color: 'var(--color-text-primary)', outline: 'none' }} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowNewGameForm(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button type="submit" disabled={isCreatingNewGame || !newObjective.trim() || !newReward.trim()} style={{ flex: 2, padding: '10px 0', borderRadius: 10, border: 'none', background: (!newObjective.trim() || !newReward.trim()) ? 'var(--color-border)' : '#FF7900', color: 'white', fontWeight: 700, fontSize: 13, cursor: (!newObjective.trim() || !newReward.trim()) ? 'not-allowed' : 'pointer' }}>{isCreatingNewGame ? 'Création...' : 'Lancer'}</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Mon pion — avance directe pour l'admin */}
      {isGameActive && myPawn && (
        <div style={adminCardStyle}>
          <p style={adminCardTitleStyle}>Mon pion — étage {myPawn.currentFloor} / {game.floorCount}</p>
          <ConfirmButton
            label="Avancer mon pion"
            confirmLabel="Confirmer l'avancement"
            color="#FF7900"
            isLoading={isAdvancing}
            onConfirm={() => adminAdvance(game.id)}
          />
        </div>
      )}

      {/* Contrôles de la partie */}
      {!isGameFinished && (
        <div style={adminCardStyle}>
          <p style={adminCardTitleStyle}>Contrôles</p>
          <div className="flex gap-2">
            {isGameActive && (
              <button onClick={() => pauseGame(game.id)} disabled={isPausing} style={adminButtonStyle('#f59e0b')}>
                {isPausing ? '...' : 'Pause'}
              </button>
            )}
            {isGamePaused && (
              <button onClick={() => resumeGame(game.id)} disabled={isResuming} style={adminButtonStyle('#22c55e')}>
                {isResuming ? '...' : 'Reprendre'}
              </button>
            )}
            <ConfirmButton label="Reset" confirmLabel="Remettre à 0 ?" color="#6b7280" isLoading={isResetting} onConfirm={() => resetGame(game.id)} />
            <ConfirmButton label="Terminer" confirmLabel="Figer le classement ?" color="#ef4444" isLoading={isFinishing} onConfirm={() => finishGame(game.id)} />
          </div>
        </div>
      )}

      {/* Demandes en attente */}
      {!isGameFinished && (
        <div style={adminCardStyle}>
          <p style={adminCardTitleStyle}>Demandes d'avancement ({pendingRequests.length})</p>
          {isLoadingRequests && <Skeleton className="h-14 w-full" />}
          {!isLoadingRequests && pendingRequests.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', margin: 0 }}>Aucune demande en attente</p>
          )}
          <div className="flex flex-col gap-2">
            {pendingRequests.map((request) => (
              <MoveRequestCard
                key={request.id}
                request={request}
                onApprove={() => resolveRequest({ requestId: request.id, approved: true })}
                onReject={() => resolveRequest({ requestId: request.id, approved: false })}
                isLoading={isResolving}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const adminCardStyle: React.CSSProperties = {
  background: 'var(--color-card)',
  borderRadius: 14,
  border: '1px solid var(--color-border-soft)',
  padding: '14px 16px',
}

const adminCardTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--color-text-tertiary)',
  margin: '0 0 10px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const primaryButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 0',
  borderRadius: 12,
  background: '#FF7900',
  color: 'white',
  fontWeight: 700,
  fontSize: 14,
  border: 'none',
  cursor: 'pointer',
}

// ── ConfirmButton — confirmation inline sans alerte navigateur ────────────────

interface ConfirmButtonProps {
  label: string
  confirmLabel: string
  color: string
  isLoading: boolean
  onConfirm: () => void
}

function ConfirmButton({ label, confirmLabel, color, isLoading, onConfirm }: ConfirmButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  function handleConfirm() {
    setIsConfirming(false)
    onConfirm()
  }

  if (isConfirming) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color, textAlign: 'center' }}>{confirmLabel}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setIsConfirming(false)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1.5px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: color, color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            Confirmer
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      disabled={isLoading}
      style={{ ...adminButtonStyle(color), flex: 1 }}
    >
      {isLoading ? '...' : label}
    </button>
  )
}

function adminButtonStyle(color: string): React.CSSProperties {
  return {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    border: `1.5px solid ${color}40`,
    background: `${color}15`,
    color: color,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  }
}

interface MoveRequestCardProps {
  request: MoveRequest
  onApprove: () => void
  onReject: () => void
  isLoading: boolean
}

function MoveRequestCard({ request, onApprove, onReject, isLoading }: MoveRequestCardProps) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: request.userColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 800, color: 'white' }}>
            {request.userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {request.userName}
        </span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, fontStyle: 'italic' }}>
        « {request.reason} »
      </p>
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            border: 'none',
            background: '#22c55e',
            color: 'white',
            fontWeight: 700,
            fontSize: 13,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          ✓ Approuver
        </button>
        <button
          onClick={onReject}
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 8,
            border: 'none',
            background: '#ef4444',
            color: 'white',
            fontWeight: 700,
            fontSize: 13,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          ✕ Refuser
        </button>
      </div>
    </div>
  )
}

// ── Vendor request panel ──────────────────────────────────────────────────────

interface VendorRequestPanelProps {
  gameId: string
}

function VendorRequestPanel({ gameId }: VendorRequestPanelProps) {
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { mutate: submitRequest, isPending } = useSubmitMoveRequest(gameId)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!reason.trim()) return
    submitRequest(reason.trim(), {
      onSuccess: () => {
        setSubmitted(true)
        setReason('')
      },
    })
  }

  if (submitted) {
    return (
      <div
        style={{
          background: '#22c55e15',
          border: '1.5px solid #22c55e40',
          borderRadius: 14,
          padding: '16px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 20, margin: 0 }}>✓</p>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', margin: '4px 0 0' }}>
          Demande envoyée !
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
          L'admin va traiter ta demande
        </p>
        <button
          onClick={() => setSubmitted(false)}
          style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Faire une nouvelle demande
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--color-card)',
        borderRadius: 14,
        border: '1px solid var(--color-border-soft)',
        padding: '14px 16px',
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Demander à avancer d'un étage
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Quel objectif est atteint, ou quelle vente réalisée ?"
          rows={3}
          required
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            border: '1.5px solid var(--color-border)',
            background: 'var(--color-surface)',
            fontSize: 13,
            color: 'var(--color-text-primary)',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={isPending || !reason.trim()}
          style={{
            padding: '12px',
            borderRadius: 12,
            background: isPending || !reason.trim() ? 'var(--color-border)' : '#FF7900',
            color: 'white',
            fontWeight: 700,
            fontSize: 14,
            border: 'none',
            cursor: isPending || !reason.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? 'Envoi...' : 'Envoyer la demande'}
        </button>
      </form>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function GameSkeleton() {
  return (
    <div className="px-4 pt-6 pb-8 max-w-[430px] mx-auto flex flex-col gap-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function BuildingIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF7900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  )
}
