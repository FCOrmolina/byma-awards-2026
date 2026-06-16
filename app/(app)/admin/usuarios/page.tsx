import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InviteForm } from "./invite-form";
import { RemoveButton } from "./remove-button";

type AdminUser = {
  email: string;
  full_name: string | null;
  role: "voter" | "admin";
  user_id: string | null;
  proposal_count: number;
  categories_covered: number;
  last_active: string | null;
};

const TOTAL_CATEGORIES = 28;

export default async function UsersAdminPage() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("admin_list_users");

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12">
        <p className="text-byma-red">
          No pudimos cargar la lista de usuarios. ¿Corriste{" "}
          <code className="font-mono">migration-v3-admin-rpcs.sql</code>?
        </p>
        <p className="text-xs text-muted mt-3 font-mono">{error.message}</p>
      </div>
    );
  }

  const users = (data ?? []) as AdminUser[];
  const voters = users.filter((u) => u.role === "voter");
  const admins = users.filter((u) => u.role === "admin");
  const activeVoters = voters.filter((u) => u.proposal_count > 0).length;
  const fullyVoted = voters.filter(
    (u) => u.categories_covered >= TOTAL_CATEGORIES,
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12">
      <Link
        href="/admin"
        className="inline-block text-xs uppercase tracking-[0.25em] text-muted hover:text-accent transition-colors mb-10"
      >
        ← Volver al dashboard
      </Link>

      <header className="mb-12">
        <p className="text-xs uppercase tracking-[0.32em] text-accent mb-3">
          Comité · Usuarios
        </p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.02] tracking-[-0.025em]">
          Quién entra a BYMA 2026
        </h1>
        <p className="mt-4 text-foreground/70 max-w-2xl leading-relaxed">
          Solo los correos en esta lista pueden pedir código de acceso. Los
          votantes proponen; los del comité además ven este dashboard.
        </p>
      </header>

      {/* Stats */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line mb-12">
        <Stat label="Votantes" value={voters.length} />
        <Stat label="Comité" value={admins.length} />
        <Stat
          label="Activos"
          value={
            voters.length > 0 ? `${activeVoters}/${voters.length}` : 0
          }
          highlight={
            voters.length > 0 && activeVoters / voters.length >= 0.5
          }
        />
        <Stat
          label="Completaron las 28"
          value={fullyVoted}
          highlight={fullyVoted > 0}
        />
      </dl>

      {/* Form */}
      <section className="border border-line p-5 sm:p-6 mb-12 bg-byma-black/40">
        <h2 className="text-xs uppercase tracking-[0.22em] text-accent mb-5">
          Invitar nuevo usuario
        </h2>
        <InviteForm />
        <p className="mt-4 text-[0.7rem] text-muted leading-relaxed">
          Si el correo ya existe, actualiza su rol y nombre. El usuario podrá
          pedir código de acceso inmediatamente con su correo.
        </p>
      </section>

      {/* Lista de usuarios */}
      <UserSection
        title="Comité"
        subtitle={`${admins.length} ${admins.length === 1 ? "persona" : "personas"}`}
        users={admins}
        totalCategories={TOTAL_CATEGORIES}
      />
      <UserSection
        title="Votantes"
        subtitle={`${activeVoters} activos · ${voters.length - activeVoters} sin entrar`}
        users={voters}
        totalCategories={TOTAL_CATEGORIES}
      />
    </div>
  );
}

function UserSection({
  title,
  subtitle,
  users,
  totalCategories,
}: {
  title: string;
  subtitle: string;
  users: AdminUser[];
  totalCategories: number;
}) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between gap-4 mb-5 pb-3 border-b border-line">
        <h2 className="font-display text-2xl">{title}</h2>
        <span className="text-xs uppercase tracking-[0.22em] text-muted">
          {subtitle}
        </span>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-muted italic">
          Nadie todavía. Invita arriba.
        </p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => {
            const completion =
              totalCategories > 0
                ? Math.round((u.categories_covered / totalCategories) * 100)
                : 0;
            const hasActed = u.proposal_count > 0;
            const lastActiveText = u.last_active
              ? new Date(u.last_active).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null;

            return (
              <li
                key={u.email}
                className="border border-line p-4 sm:p-5 bg-background/40 hover:bg-foreground/[0.03] transition-colors"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg leading-tight">
                      {u.full_name || (
                        <span className="text-muted italic">Sin nombre</span>
                      )}
                    </p>
                    <p className="text-xs text-foreground/70 font-mono mt-0.5">
                      {u.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {u.role === "admin" && (
                      <span className="text-[0.6rem] uppercase tracking-[0.22em] px-2 py-1 border border-accent/50 text-accent">
                        Comité
                      </span>
                    )}
                    {u.user_id && hasActed ? (
                      <Link
                        href={`/admin/votantes/${u.user_id}`}
                        className="text-xs uppercase tracking-[0.2em] text-muted hover:text-accent transition-colors"
                      >
                        Ver propuestas →
                      </Link>
                    ) : (
                      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted">
                        {u.user_id ? "Sin propuestas" : "Sin entrar"}
                      </span>
                    )}
                    <RemoveButton email={u.email} />
                  </div>
                </div>

                {u.role === "voter" && (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-[3px] bg-line overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${completion}%`,
                            background:
                              completion === 100
                                ? "var(--byma-orange)"
                                : completion > 0
                                  ? "var(--byma-cream)"
                                  : "transparent",
                            opacity: completion > 0 ? 1 : 0,
                          }}
                        />
                      </div>
                      <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted whitespace-nowrap font-mono tabular-nums">
                        {u.categories_covered}/{totalCategories} categorías
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[0.7rem] uppercase tracking-[0.18em] text-muted">
                      <span>
                        <span className="text-foreground tabular-nums">
                          {u.proposal_count}
                        </span>{" "}
                        propuestas
                      </span>
                      {lastActiveText && (
                        <span>
                          Última actividad:{" "}
                          <span className="text-foreground/80">
                            {lastActiveText}
                          </span>
                        </span>
                      )}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-background p-4 sm:p-5">
      <dt className="text-[0.6rem] uppercase tracking-[0.22em] text-muted">
        {label}
      </dt>
      <dd
        className={`font-display text-2xl sm:text-3xl mt-1.5 tabular-nums ${
          highlight ? "text-accent" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
