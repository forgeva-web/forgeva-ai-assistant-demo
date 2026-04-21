// @/components/demo/TechStackSection.tsx
import { OpenAiLogoIcon } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  siNextdotjs,
  siApollographql,
  siGraphql,
  siPrisma,
  siSupabase,
  siAnthropic,
  siTailwindcss,
  siClerk,
  siVercel,
  siPostgresql,
} from 'simple-icons';

// ── Icon type union ────────────────────────────────────────
type SimpleIcon = { path: string; hex: string };
type TechIcon =
  | { type: 'simple'; icon: SimpleIcon }
  | { type: 'phosphor'; icon: PhosphorIcon };

type TechItem = {
  name: string;
  icon: TechIcon;
  href: string;
};

type TechGroup = {
  group: string;
  items: TechItem[];
};

// ── Helper wrappers so call sites stay clean ───────────────
function si(icon: SimpleIcon): TechIcon {
  return { type: 'simple', icon };
}
function ph(icon: PhosphorIcon): TechIcon {
  return { type: 'phosphor', icon };
}

// ── Data ───────────────────────────────────────────────────
const TECH_STACK: TechGroup[] = [
  {
    group: 'Frontend',
    items: [
      { name: 'Next.js 15', icon: si(siNextdotjs), href: 'https://nextjs.org' },
      {
        name: 'Apollo Client',
        icon: si(siApollographql),
        href: 'https://apollographql.com',
      },
      {
        name: 'Tailwind v4',
        icon: si(siTailwindcss),
        href: 'https://tailwindcss.com',
      },
    ],
  },
  {
    group: 'Backend',
    items: [
      { name: 'GraphQL', icon: si(siGraphql), href: 'https://graphql.org' },
      { name: 'Prisma 7', icon: si(siPrisma), href: 'https://prisma.io' },
      { name: 'Supabase', icon: si(siSupabase), href: 'https://supabase.com' },
      {
        name: 'pgvector',
        icon: si(siPostgresql),
        href: 'https://github.com/pgvector/pgvector',
      },
    ],
  },
  {
    group: 'AI',
    items: [
      {
        name: 'Anthropic Claude',
        icon: si(siAnthropic),
        href: 'https://anthropic.com',
      },
      {
        name: 'OpenAI Embeddings',
        icon: ph(OpenAiLogoIcon),
        href: 'https://openai.com',
      },
    ],
  },
  {
    group: 'Infra',
    items: [
      { name: 'Clerk', icon: si(siClerk), href: 'https://clerk.com' },
      { name: 'Vercel', icon: si(siVercel), href: 'https://vercel.com' },
    ],
  },
];

// ── Icon renderer ──────────────────────────────────────────
function TechIconRenderer({ icon, name }: { icon: TechIcon; name: string }) {
  if (icon.type === 'phosphor') {
    const Icon = icon.icon;
    return (
      <Icon
        className="size-4 shrink-0"
        style={{ opacity: 0.75 }}
        aria-label={name}
      />
    );
  }

  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      style={{ fill: `#${icon.icon.hex}`, opacity: 0.75 }}
      aria-label={name}
    >
      <path d={icon.icon.path} />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────
export function TechStackSection() {
  return (
    <section>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Built With
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TECH_STACK.map(({ group, items }) => (
          <div
            key={group}
            className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden"
          >
            <div className="border-b border-border/30 bg-muted/30 px-3 py-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group}
              </p>
            </div>

            <div className="divide-y divide-border/20">
              {items.map(({ name, icon, href }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-muted/40 group"
                >
                  <TechIconRenderer icon={icon} name={name} />
                  <span className="text-[11px] font-mono text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <a
        href="https://github.com/duffymitch12/forgeva-ai-assistant"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-3"
          aria-hidden="true"
        >
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
        github.com/duffymitch12/forgeva-ai-assistant
      </a>
    </section>
  );
}
