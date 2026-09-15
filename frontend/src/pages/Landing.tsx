import { Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Stamp,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Lock,
  Zap,
  EyeOff,
  Blocks,
  KeyRound,
  Layers,
  Landmark,
  Building2,
  Users,
  BadgeCheck,
  ScanLine,
  FileWarning,
  Clock,
  Unlock,
  ServerCrash,
} from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* --------------------------------- data --------------------------------- */

const PROBLEMS = [
  { Icon: FileWarning, key: "forgery" },
  { Icon: Clock, key: "verify" },
  { Icon: Unlock, key: "privacy" },
  { Icon: ServerCrash, key: "central" },
] as const;

const PRINCIPLES = [
  { Icon: Lock, key: "antifraud" },
  { Icon: Zap, key: "instant" },
  { Icon: EyeOff, key: "privacy" },
] as const;

const ROLES = [
  { Icon: Stamp, roleKey: "nav.issuer", bodyKey: "landing.flow.issuer" },
  { Icon: GraduationCap, roleKey: "nav.holder", bodyKey: "landing.flow.holder" },
  { Icon: ShieldCheck, roleKey: "nav.verifier", bodyKey: "landing.flow.verifier" },
] as const;

const DIFFERENTIATORS = [
  { Icon: Blocks, key: "ledger" },
  { Icon: KeyRound, key: "zk" },
  { Icon: GraduationCap, key: "holder" },
  { Icon: Layers, key: "flexible" },
] as const;

const BENEFITS = [
  { Icon: Building2, key: "issuer" },
  { Icon: GraduationCap, key: "holder" },
  { Icon: ShieldCheck, key: "verifier" },
  { Icon: Landmark, key: "public" },
] as const;

const FAQ_KEYS = ["1", "2", "3", "4", "5", "6"] as const;

/* ------------------------------- component ------------------------------ */

function SectionHeading({ title, lead }: { title: string; lead?: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-balance font-serif text-3xl font-semibold leading-[1.1] text-ink sm:text-4xl">
        {title}
      </h2>
      {lead && <p className="mt-4 text-pretty leading-relaxed text-ink-muted">{lead}</p>}
    </div>
  );
}

export const LandingPage = () => {
  const { isConnected, isIssuer, isAdmin } = useRole();
  const { t } = useT();
  const canIssue = isIssuer || isAdmin;

  return (
    <div className="space-y-24 pb-8 sm:space-y-32">
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="grid animate-fade-up items-center gap-12 pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        <div>
          <Badge tone="primary" className="mb-5 px-3 py-1">
            <ShieldCheck size={13} aria-hidden="true" />
            {t("landing.eyebrow")}
          </Badge>
          <h1 className="text-balance font-serif text-[2.6rem] font-semibold leading-[1.03] text-ink sm:text-6xl">
            {t("lp.hero.title")}
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-ink-muted">
            {t("lp.hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!isConnected ? (
              <>
                <ConnectButton />
                <Button variant="ghost" asChild>
                  <a href="#how">
                    {t("lp.hero.learn")} <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </Button>
              </>
            ) : (
              <>
                {canIssue && (
                  <Button asChild>
                    <Link to="/issuer">
                      <Stamp size={16} aria-hidden="true" /> {t("landing.goIssuer")}
                    </Link>
                  </Button>
                )}
                <Button variant={canIssue ? "secondary" : "default"} asChild>
                  <Link to="/holder">
                    <GraduationCap size={16} aria-hidden="true" /> {t("landing.goHolder")}
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/verifier">
                    <ShieldCheck size={16} aria-hidden="true" /> {t("landing.goVerifier")}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Signature visual: a credential artifact + a live selective-disclosure proof */}
        <HeroArtifact />
      </section>

      {/* ---------------------------- Problem ----------------------------- */}
      <section>
        <SectionHeading title={t("lp.problem.title")} lead={t("lp.problem.lead")} />
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {PROBLEMS.map(({ Icon, key }) => (
            <div key={key} className="flex gap-4 bg-surface p-6">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-danger-tint text-danger-ink"
                aria-hidden="true"
              >
                <Icon size={19} />
              </span>
              <div>
                <h3 className="font-semibold text-ink">{t(`lp.problem.${key}.title`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {t(`lp.problem.${key}.body`)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3 rounded-xl border border-line bg-sunken/50 p-5">
          <Landmark size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-ink-muted">{t("lp.problem.context")}</p>
        </div>
      </section>

      {/* ---------------------------- Solution ---------------------------- */}
      <section>
        <SectionHeading title={t("lp.solution.title")} lead={t("lp.solution.lead")} />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PRINCIPLES.map(({ Icon, key }) => (
            <div key={key} className="flex flex-col rounded-xl border border-line bg-surface p-6 shadow-sm">
              <span
                className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary text-white shadow-xs"
                aria-hidden="true"
              >
                <Icon size={20} />
              </span>
              <h3 className="font-serif text-lg font-semibold text-ink">
                {t(`lp.principle.${key}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t(`lp.principle.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary-tint px-5 py-4">
          <KeyRound size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-pretty text-sm leading-relaxed text-ink">
            <span className="font-semibold">{t("lp.solution.analogyLead")}</span>{" "}
            {t("lp.solution.analogy")}
          </p>
        </div>
      </section>

      {/* -------------------------- How it works -------------------------- */}
      <section id="how" className="scroll-mt-24">
        <SectionHeading title={t("lp.how.title")} lead={t("lp.how.lead")} />
        <ol className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-3">
          {ROLES.map(({ Icon, roleKey, bodyKey }, i) => (
            <li key={roleKey} className="relative flex flex-col gap-3 bg-surface p-6">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-10 w-10 place-items-center rounded-lg bg-primary-tint text-primary"
                  aria-hidden="true"
                >
                  <Icon size={19} />
                </span>
                <span className="font-mono text-sm text-ink-subtle">
                  {t("landing.step")} {i + 1}
                </span>
                {i < ROLES.length - 1 && (
                  <ArrowRight
                    size={16}
                    className="ml-auto hidden text-ink-subtle md:block"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-ink">{t(roleKey)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t(bodyKey)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------- Differentiators ------------------------ */}
      <section>
        <SectionHeading title={t("lp.diff.title")} />
        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {DIFFERENTIATORS.map(({ Icon, key }) => (
            <div key={key} className="flex gap-4 border-t border-line pt-6">
              <Icon size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-ink">{t(`lp.diff.${key}.title`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {t(`lp.diff.${key}.body`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------- Benefits ---------------------------- */}
      <section>
        <SectionHeading title={t("lp.benefits.title")} />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {BENEFITS.map(({ Icon, key }) => (
            <div key={key} className="rounded-xl border border-line bg-surface p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2.5">
                <Icon size={18} className="text-primary" aria-hidden="true" />
                <h3 className="font-semibold text-ink">{t(`lp.benefit.${key}.party`)}</h3>
              </div>
              <p className="text-sm leading-relaxed text-ink-muted">{t(`lp.benefit.${key}.gain`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------- Scenario ---------------------------- */}
      <section>
        <div className="overflow-hidden rounded-2xl border border-line bg-ink text-paper shadow-lg">
          <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-paper/80">
                <BadgeCheck size={13} aria-hidden="true" /> {t("lp.scenario.tag")}
              </span>
              <h2 className="mt-5 text-balance font-serif text-2xl font-semibold leading-tight sm:text-3xl">
                {t("lp.scenario.title")}
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-paper/75">{t("lp.scenario.p1")}</p>
              <p className="mt-3 text-pretty leading-relaxed text-paper/75">{t("lp.scenario.p2")}</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-valid/40 bg-valid/15 px-4 py-2.5 font-mono text-sm text-valid">
                <BadgeCheck size={16} aria-hidden="true" /> {t("lp.scenario.result")}
              </div>
            </div>
            <ScanLine
              size={104}
              strokeWidth={1}
              className="hidden justify-self-end text-paper/15 lg:block"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* ------------------------------- FAQ ------------------------------ */}
      <section>
        <SectionHeading title={t("lp.faq.title")} lead={t("lp.faq.lead")} />
        <div className="mt-8 max-w-3xl">
          <Accordion type="single" collapsible className="border-t border-line">
            {FAQ_KEYS.map((k) => (
              <AccordionItem key={k} value={k}>
                <AccordionTrigger>{t(`lp.faq.q${k}`)}</AccordionTrigger>
                <AccordionContent>{t(`lp.faq.a${k}`)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ------------------------------ Close ----------------------------- */}
      <section>
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-line bg-surface px-6 py-14 text-center shadow-sm">
          <div className="max-w-2xl">
            <h2 className="text-balance font-serif text-3xl font-semibold leading-tight text-ink">
              {t("lp.close.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-ink-muted">
              {t("lp.close.body")}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!isConnected ? (
              <ConnectButton />
            ) : (
              <Button asChild>
                <Link to="/holder">
                  {t("landing.goHolder")} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </Button>
            )}
            <Button variant="secondary" asChild>
              <Link to="/verifier">
                <ShieldCheck size={16} aria-hidden="true" /> {t("landing.goVerifier")}
              </Link>
            </Button>
          </div>
          <p className="max-w-lg text-xs leading-relaxed text-ink-subtle">{t("lp.close.note")}</p>
        </div>
      </section>
    </div>
  );
};

/* ------------------------- hero signature visual ------------------------ */

function HeroArtifact() {
  const { t } = useT();
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0" aria-hidden="true">
      {/* Certificate */}
      <div className="rotate-[-2deg] rounded-2xl border border-line bg-surface p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <span className="font-mono text-xs text-ink-subtle">№0042 · Academic Diploma</span>
          <Badge tone="valid">
            <BadgeCheck size={12} /> {t("card.verified")}
          </Badge>
        </div>
        <div className="mt-5 flex items-start gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-primary/30 text-primary">
            <Stamp size={24} strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="font-serif text-xl font-semibold leading-tight text-ink">Ada Lovelace</p>
            <p className="text-sm text-ink-muted">B.Sc. Computer Science · Nusantara University</p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between rounded-md bg-sunken px-3 py-2">
            <span className="text-xs text-ink-subtle">GPA</span>
            <span className="font-mono text-sm text-ink-subtle">•••• {t("lp.hero.hidden")}</span>
          </div>
          <div className="h-2 rounded bg-sunken" />
          <div className="h-2 w-2/3 rounded bg-sunken" />
        </div>
      </div>

      {/* Floating proof chip — the selective-disclosure moment */}
      <div className="absolute -bottom-5 right-0 rotate-[3deg] rounded-xl border border-valid/30 bg-surface p-4 shadow-lg sm:-right-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-valid-tint text-valid-ink">
            <BadgeCheck size={16} />
          </span>
          <div>
            <p className="font-mono text-xs font-semibold text-ink">GPA ≥ 3.5</p>
            <p className="font-mono text-[0.7rem] text-valid-ink">{t("lp.hero.proof")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
