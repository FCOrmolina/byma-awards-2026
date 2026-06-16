export type ColorKey = "AZUL" | "CREMA" | "NARANJA" | "NEGRO" | "ROJO";

export type Bucket = "MAKERS" | "PLAYERS" | "DISTRIBUTION" | "LIVE" | "IMPACT";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  color_key: ColorKey;
  bucket: Bucket;
  sort_order: number;
};

export const BACKGROUNDS: Record<ColorKey, string> = {
  AZUL: "/backgrounds/AZUL.png",
  CREMA: "/backgrounds/CREMA.png",
  NARANJA: "/backgrounds/NARANJA.png",
  NEGRO: "/backgrounds/NEGRO.png",
  ROJO: "/backgrounds/ROJO.png",
};

/** Metadata visual y narrativa de cada bucket — refleja el manual oficial BYMA. */
export const BUCKETS: Record<
  Bucket,
  { label: string; verb: string; tagline: string; accent: string }
> = {
  MAKERS: {
    label: "Makers",
    verb: "Construyen",
    tagline:
      "Los que dan forma al sonido. Compositores, productores, músicos, estudios e ingenieros.",
    accent: "var(--byma-orange)",
  },
  PLAYERS: {
    label: "Players",
    verb: "Protegen",
    tagline:
      "Los que sostienen el negocio. Ejecutivos, labels, promotoras, managers y A&R.",
    accent: "var(--byma-blue)",
  },
  DISTRIBUTION: {
    label: "Distribution",
    verb: "Distribuyen",
    tagline:
      "Los que mueven la música por el mundo. Plataformas, agregadoras, trends y líderes de la conversación.",
    accent: "var(--byma-cream)",
  },
  LIVE: {
    label: "Live",
    verb: "Inspiran",
    tagline:
      "Los que prenden el escenario. Giras, festivales, shows, dirección musical y venues.",
    accent: "var(--byma-red)",
  },
  IMPACT: {
    label: "Impact",
    verb: "Forjan legado",
    tagline:
      "Los que van más allá del sonido. Impacto cultural, estrategia digital, marcas, fans y causas.",
    accent: "var(--byma-orange)",
  },
};

export const BUCKET_ORDER: Bucket[] = [
  "MAKERS",
  "PLAYERS",
  "DISTRIBUTION",
  "LIVE",
  "IMPACT",
];
