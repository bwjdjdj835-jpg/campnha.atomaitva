import { ExternalLink } from 'lucide-react'

// Seção "Projeto" pedida pela Abelha Central: tudo que é preciso para recriar o pipeline.
const groups = [
  {
    title: 'Busca e dados',
    items: [
      { name: 'Google Places API (New)', url: 'https://developers.google.com/maps/documentation/places/web-service/text-search', uso: 'Pinguim — busca de negócios' },
      { name: 'Firecrawl', url: 'https://www.firecrawl.dev', uso: 'Pinguim, Gato, Abelha — busca e scraping' },
    ],
  },
  {
    title: 'Construção e publicação',
    items: [
      { name: 'React + Vite', url: 'https://vite.dev', uso: 'Base deste app e dos sites gerados' },
      { name: 'Tailwind CSS', url: 'https://tailwindcss.com', uso: 'Estilo dos sites' },
      { name: 'JSZip', url: 'https://stuk.github.io/jszip/', uso: 'Leão / Gato — geração do ZIP' },
      { name: 'Cloudinary', url: 'https://cloudinary.com', uso: 'Leão — hospedagem das imagens' },
      { name: 'Vercel', url: 'https://vercel.com', uso: 'Tigre — publicação do site final' },
      { name: 'Netlify', url: 'https://www.netlify.com', uso: 'Alternativa ao Vercel' },
    ],
  },
  {
    title: 'Contato e IA',
    items: [
      { name: 'WhatsApp Business Platform', url: 'https://developers.facebook.com/docs/whatsapp/cloud-api', uso: 'Tigre — mensagens' },
      { name: 'Claude API', url: 'https://docs.claude.com', uso: 'Respostas e textos dos agentes' },
    ],
  },
  {
    title: 'Orquestração e ambiente',
    items: [
      { name: 'n8n', url: 'https://n8n.io', uso: 'Automação entre agentes (opcional)' },
      { name: 'Make', url: 'https://www.make.com', uso: 'Alternativa ao n8n' },
      { name: 'Supabase', url: 'https://supabase.com', uso: 'Banco de dados e storage' },
      { name: 'Visual Studio Code', url: 'https://code.visualstudio.com', uso: 'Edição final do site' },
      { name: 'Claude Code', url: 'https://docs.claude.com/en/docs/claude-code/overview', uso: 'Continuar o desenvolvimento' },
    ],
  },
]

export default function Projeto() {
  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs font-mono tracking-[0.3em] text-neon">PROJETO</div>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-white">Ferramentas do pipeline</h1>
        <p className="mt-2 text-slate-400">Tudo que você precisa para recriar a orquestra completa, num lugar só.</p>
      </header>
      {groups.map((g) => (
        <section key={g.title}>
          <h2 className="font-display text-lg font-semibold text-white mb-3">{g.title}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {g.items.map((it) => (
              <a key={it.name} href={it.url} target="_blank" rel="noreferrer"
                className="group glass p-4 flex items-start gap-3 hover:border-neon/40 hover:shadow-glow transition">
                <div className="flex-1">
                  <div className="text-white font-medium">{it.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{it.uso}</div>
                </div>
                <ExternalLink size={16} className="text-slate-500 group-hover:text-neon" />
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
