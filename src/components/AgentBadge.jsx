// Medalhão circular com brilho, no estilo da capa do projeto.
// TODO (Claude Code): trocar o emoji pelos logos vetoriais definitivos em /src/assets/logos.
export default function AgentBadge({ agent, size = 64, pulse = false }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {pulse && (
        <span
          className="absolute inset-0 rounded-full animate-pulse-ring"
          style={{ border: `2px solid ${agent.accent}` }}
        />
      )}
      <div
        className="relative grid place-items-center w-full h-full rounded-full bg-abyss-800"
        style={{
          border: '2px solid rgba(34,211,238,.7)',
          boxShadow: `0 0 24px -4px rgba(34,211,238,.6), inset 0 0 18px -6px ${agent.accent}`,
        }}
      >
        <span style={{ fontSize: size * 0.48, lineHeight: 1 }}>{agent.emoji}</span>
      </div>
    </div>
  )
}
