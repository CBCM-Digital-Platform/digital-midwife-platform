"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { AlertCircle, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAdminLandingPageContent,
  updateLandingPageContent,
} from "@/services/landing-page.service";
import type {
  LandingPageContent,
  LandingPageFeatureCard,
  LandingPageRoleCard,
  LandingPageStat,
  LandingPageTextEntry,
} from "@/types/landing-page";

function messageFromError(error: unknown): string {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-gray-700">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#194611]"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-gray-700">
      <span>{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#194611]"
      />
    </label>
  );
}

function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-700">{label}</legend>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className="flex items-center gap-2">
          <input
            value={item}
            onChange={(event) => onChange(items.map((current, i) => (i === index ? event.target.value : current)))}
            className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#194611]"
          />
          <Button
            type="button"
            variant="outline"
            aria-label={`Remove ${label} ${index + 1}`}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange([...items, ""])}>
        <Plus aria-hidden="true" />
        Add item
      </Button>
    </fieldset>
  );
}

function TextEntriesEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: LandingPageTextEntry[];
  onChange: (items: LandingPageTextEntry[]) => void;
}) {
  const updateEntry = (index: number, patch: Partial<LandingPageTextEntry>) => {
    onChange(items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, ...patch } : item
    )));
  };

  return (
    <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
      <legend className="px-1 text-sm font-semibold text-gray-800">{label}</legend>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className="space-y-3 rounded-md bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-gray-500">Item {index + 1}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              <Trash2 aria-hidden="true" />
              Remove
            </Button>
          </div>
          <TextField
            label="Title"
            value={item.title}
            onChange={(title) => updateEntry(index, { title })}
          />
          <TextAreaField
            label="Description"
            value={item.description}
            onChange={(description) => updateEntry(index, { description })}
            rows={2}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...items, { title: "", description: "" }])}
      >
        <Plus aria-hidden="true" />
        Add item
      </Button>
    </fieldset>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <details open className="rounded-xl border border-gray-200 bg-white">
      <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-gray-900 marker:hidden">
        <span>{title}</span>
        <span className="mt-1 block text-sm font-normal text-gray-500">{description}</span>
      </summary>
      <div className="space-y-5 border-t border-gray-100 p-5">{children}</div>
    </details>
  );
}

function newFeatureCard(): LandingPageFeatureCard {
  return {
    id: `feature-${Date.now()}`,
    step: "",
    status: "",
    category: "",
    title: "",
    description: "",
    image_url: "",
    image_alt: "",
    features: [],
  };
}

function newRoleCard(): LandingPageRoleCard {
  return {
    id: `role-${Date.now()}`,
    label: "",
    eyebrow: "",
    title: "",
    description: "",
    image_url: "",
    image_alt: "",
    caption: "",
    subcaption: "",
    highlights: [],
    feature_cards: [],
  };
}

function newStat(): LandingPageStat {
  return {
    id: `stat-${Date.now()}`,
    value: 0,
    suffix: "",
    label: "",
    description: "",
  };
}

export function LandingPageManagement() {
  const [content, setContent] = useState<LandingPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getAdminLandingPageContent()
      .then((result) => {
        if (active) setContent(result);
      })
      .catch((loadError: unknown) => {
        if (active) setError(messageFromError(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const updateContent = (update: (current: LandingPageContent) => LandingPageContent) => {
    setContent((current) => current ? update(current) : current);
    setNotice(null);
    setError(null);
  };

  const updateHero = (patch: Partial<LandingPageContent["hero"]>) => {
    updateContent((current) => ({ ...current, hero: { ...current.hero, ...patch } }));
  };

  const updateHowItWorks = (
    patch: Partial<Omit<LandingPageContent["how_it_works"], "cards">>
  ) => {
    updateContent((current) => ({
      ...current,
      how_it_works: { ...current.how_it_works, ...patch },
    }));
  };

  const updateFeatureCard = (index: number, patch: Partial<LandingPageFeatureCard>) => {
    updateContent((current) => ({
      ...current,
      how_it_works: {
        ...current.how_it_works,
        cards: current.how_it_works.cards.map((card, cardIndex) => (
          cardIndex === index ? { ...card, ...patch } : card
        )),
      },
    }));
  };

  const updateRoles = (patch: Partial<Omit<LandingPageContent["roles"], "cards">>) => {
    updateContent((current) => ({ ...current, roles: { ...current.roles, ...patch } }));
  };

  const updateRoleCard = (index: number, patch: Partial<LandingPageRoleCard>) => {
    updateContent((current) => ({
      ...current,
      roles: {
        ...current.roles,
        cards: current.roles.cards.map((card, cardIndex) => (
          cardIndex === index ? { ...card, ...patch } : card
        )),
      },
    }));
  };

  const updateImpact = (patch: Partial<Omit<LandingPageContent["impact"], "stats" | "cta">>) => {
    updateContent((current) => ({ ...current, impact: { ...current.impact, ...patch } }));
  };

  const updateStat = (index: number, patch: Partial<LandingPageStat>) => {
    updateContent((current) => ({
      ...current,
      impact: {
        ...current.impact,
        stats: current.impact.stats.map((stat, statIndex) => (
          statIndex === index ? { ...stat, ...patch } : stat
        )),
      },
    }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await updateLandingPageContent(content);
      setContent(saved);
      setNotice("Landing page content saved. Visitors will see the updates on the public landing page.");
    } catch (saveError) {
      setError(messageFromError(saveError));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-gray-600" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        Loading landing page content...
      </div>
    );
  }

  if (!content) {
    return (
      <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-800" role="alert">{error || "Landing page content is unavailable."}</p>
        <Button type="button" variant="outline" onClick={() => {
          setLoading(true);
          setError(null);
          setReloadKey((current) => current + 1);
        }}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <Section title="Hero section" description="Main landing-page message, photo, badges, and trust points.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Eyebrow" value={content.hero.eyebrow} onChange={(eyebrow) => updateHero({ eyebrow })} />
          <TextField label="Main heading" value={content.hero.title} onChange={(title) => updateHero({ title })} />
          <TextField label="Highlighted heading" value={content.hero.highlight} onChange={(highlight) => updateHero({ highlight })} />
          <TextField label="Photo URL or public path" value={content.hero.image_url} onChange={(image_url) => updateHero({ image_url })} placeholder="/image.png or https://..." />
          <TextField label="Photo description" value={content.hero.image_alt} onChange={(image_alt) => updateHero({ image_alt })} />
          <TextField label="Connected hospitals badge" value={content.hero.connected_badge} onChange={(connected_badge) => updateHero({ connected_badge })} />
          <TextField label="Verification title" value={content.hero.verification_title} onChange={(verification_title) => updateHero({ verification_title })} />
          <TextField label="Verification label" value={content.hero.verification_label} onChange={(verification_label) => updateHero({ verification_label })} />
          <TextField label="Verification description" value={content.hero.verification_description} onChange={(verification_description) => updateHero({ verification_description })} />
        </div>
        <TextAreaField label="Description" value={content.hero.description} onChange={(description) => updateHero({ description })} />
        <StringListEditor
          label="Trust points"
          items={content.hero.proof_points}
          onChange={(proof_points) => updateHero({ proof_points })}
        />
      </Section>

      <Section title="How it works cards" description="Edit, add, or remove the illustrated feature cards.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Section eyebrow" value={content.how_it_works.eyebrow} onChange={(eyebrow) => updateHowItWorks({ eyebrow })} />
          <TextField label="Section heading" value={content.how_it_works.title} onChange={(title) => updateHowItWorks({ title })} />
          <TextField label="Highlighted heading" value={content.how_it_works.highlight} onChange={(highlight) => updateHowItWorks({ highlight })} />
        </div>
        <TextAreaField label="Section description" value={content.how_it_works.description} onChange={(description) => updateHowItWorks({ description })} />
        {content.how_it_works.cards.map((card, index) => (
          <fieldset key={`${card.id}-${index}`} className="space-y-4 rounded-lg border border-gray-200 p-4">
            <legend className="px-1 font-semibold text-gray-800">{card.title || `Feature card ${index + 1}`}</legend>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => updateContent((current) => ({
                  ...current,
                  how_it_works: {
                    ...current.how_it_works,
                    cards: current.how_it_works.cards.filter((_, cardIndex) => cardIndex !== index),
                  },
                }))}
              >
                <Trash2 aria-hidden="true" />
                Remove card
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Step label" value={card.step} onChange={(step) => updateFeatureCard(index, { step })} />
              <TextField label="Image badge" value={card.status} onChange={(status) => updateFeatureCard(index, { status })} />
              <TextField label="Category label" value={card.category} onChange={(category) => updateFeatureCard(index, { category })} />
              <TextField label="Card title" value={card.title} onChange={(title) => updateFeatureCard(index, { title })} />
              <TextField label="Image URL or public path" value={card.image_url} onChange={(image_url) => updateFeatureCard(index, { image_url })} placeholder="/image2.jpg or https://..." />
              <TextField label="Image description" value={card.image_alt} onChange={(image_alt) => updateFeatureCard(index, { image_alt })} />
            </div>
            <TextAreaField label="Description" value={card.description} onChange={(description) => updateFeatureCard(index, { description })} />
            <StringListEditor
              label="Card feature points"
              items={card.features}
              onChange={(features) => updateFeatureCard(index, { features })}
            />
          </fieldset>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => updateContent((current) => ({
            ...current,
            how_it_works: { ...current.how_it_works, cards: [...current.how_it_works.cards, newFeatureCard()] },
          }))}
        >
          <Plus aria-hidden="true" />
          Add feature card
        </Button>
      </Section>

      <Section title="Role cards" description="Update the role tabs, content, images, and the lists shown for each role.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Section eyebrow" value={content.roles.eyebrow} onChange={(eyebrow) => updateRoles({ eyebrow })} />
          <TextField label="Section heading" value={content.roles.title} onChange={(title) => updateRoles({ title })} />
          <TextField label="Highlighted heading" value={content.roles.highlight} onChange={(highlight) => updateRoles({ highlight })} />
        </div>
        <TextAreaField label="Section description" value={content.roles.description} onChange={(description) => updateRoles({ description })} />
        {content.roles.cards.map((card, index) => (
          <fieldset key={`${card.id}-${index}`} className="space-y-4 rounded-lg border border-gray-200 p-4">
            <legend className="px-1 font-semibold text-gray-800">{card.label || `Role card ${index + 1}`}</legend>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => updateContent((current) => ({
                  ...current,
                  roles: {
                    ...current.roles,
                    cards: current.roles.cards.filter((_, cardIndex) => cardIndex !== index),
                  },
                }))}
              >
                <Trash2 aria-hidden="true" />
                Remove role
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Tab label" value={card.label} onChange={(label) => updateRoleCard(index, { label })} />
              <TextField label="Role identifier (unique)" value={card.id} onChange={(id) => updateRoleCard(index, { id })} />
              <TextField label="Role eyebrow" value={card.eyebrow} onChange={(eyebrow) => updateRoleCard(index, { eyebrow })} />
              <TextField label="Role heading" value={card.title} onChange={(title) => updateRoleCard(index, { title })} />
              <TextField label="Image URL or public path" value={card.image_url} onChange={(image_url) => updateRoleCard(index, { image_url })} placeholder="/image3.jpg or https://..." />
              <TextField label="Image description" value={card.image_alt} onChange={(image_alt) => updateRoleCard(index, { image_alt })} />
              <TextField label="Image caption" value={card.caption} onChange={(caption) => updateRoleCard(index, { caption })} />
              <TextField label="Image subcaption" value={card.subcaption} onChange={(subcaption) => updateRoleCard(index, { subcaption })} />
            </div>
            <TextAreaField label="Description" value={card.description} onChange={(description) => updateRoleCard(index, { description })} />
            <TextEntriesEditor
              label="Role highlights"
              items={card.highlights}
              onChange={(highlights) => updateRoleCard(index, { highlights })}
            />
            <TextEntriesEditor
              label="Role feature cards"
              items={card.feature_cards}
              onChange={(feature_cards) => updateRoleCard(index, { feature_cards })}
            />
          </fieldset>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => updateContent((current) => ({
            ...current,
            roles: { ...current.roles, cards: [...current.roles.cards, newRoleCard()] },
          }))}
        >
          <Plus aria-hidden="true" />
          Add role card
        </Button>
      </Section>

      <Section title="Impact statistics and final call to action" description="Edit or remove the displayed statistics and update the closing message.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Section eyebrow" value={content.impact.eyebrow} onChange={(eyebrow) => updateImpact({ eyebrow })} />
          <TextField label="Section heading" value={content.impact.title} onChange={(title) => updateImpact({ title })} />
        </div>
        <TextAreaField label="Section description" value={content.impact.description} onChange={(description) => updateImpact({ description })} />
        <h3 className="font-semibold text-gray-900">Statistics</h3>
        {content.impact.stats.map((stat, index) => (
          <fieldset key={`${stat.id}-${index}`} className="space-y-4 rounded-lg border border-gray-200 p-4">
            <legend className="px-1 font-semibold text-gray-800">{stat.label || `Statistic ${index + 1}`}</legend>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => updateContent((current) => ({
                  ...current,
                  impact: {
                    ...current.impact,
                    stats: current.impact.stats.filter((_, statIndex) => statIndex !== index),
                  },
                }))}
              >
                <Trash2 aria-hidden="true" />
                Remove statistic
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium text-gray-700">
                <span>Value</span>
                <input
                  type="number"
                  min="0"
                  value={stat.value}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value)) updateStat(index, { value });
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#194611]"
                />
              </label>
              <TextField label="Suffix" value={stat.suffix} onChange={(suffix) => updateStat(index, { suffix })} />
              <TextField label="Statistic label" value={stat.label} onChange={(label) => updateStat(index, { label })} />
              <TextField label="Statistic description" value={stat.description} onChange={(description) => updateStat(index, { description })} />
            </div>
          </fieldset>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => updateContent((current) => ({
            ...current,
            impact: { ...current.impact, stats: [...current.impact.stats, newStat()] },
          }))}
        >
          <Plus aria-hidden="true" />
          Add statistic
        </Button>
        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900">Closing call to action</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Eyebrow" value={content.impact.cta.eyebrow} onChange={(eyebrow) => updateContent((current) => ({ ...current, impact: { ...current.impact, cta: { ...current.impact.cta, eyebrow } } }))} />
            <TextField label="Button label" value={content.impact.cta.button_label} onChange={(button_label) => updateContent((current) => ({ ...current, impact: { ...current.impact, cta: { ...current.impact.cta, button_label } } }))} />
          </div>
          <TextField label="Heading" value={content.impact.cta.title} onChange={(title) => updateContent((current) => ({ ...current, impact: { ...current.impact, cta: { ...current.impact.cta, title } } }))} />
          <TextAreaField label="Description" value={content.impact.cta.description} onChange={(description) => updateContent((current) => ({ ...current, impact: { ...current.impact, cta: { ...current.impact.cta, description } } }))} />
        </div>
      </Section>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
          {saving ? "Saving..." : "Save landing page"}
        </Button>
      </div>
    </form>
  );
}
