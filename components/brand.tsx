type LogoProps = {
  className?: string;
  width?: number;
};

export function Logo({ className, width = 220 }: LogoProps) {
  const height = Math.round((width * 433.17) / 1558.05);
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/svg/logo-byma.svg"
      alt="BYMA — Beyond Music Awards"
      width={width}
      height={height}
      className={className}
    />
  );
}

type SigilProps = {
  className?: string;
  size?: number;
};

/** Disco único de ondas — color crema baked-in en el SVG. */
export function Sigil({ className, size = 480 }: SigilProps) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/svg/sigil.svg"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
    />
  );
}

type StackProps = {
  className?: string;
  width?: number;
};

/** Rail vertical de 4 platillos (Recurso 20) — color crema baked-in. */
export function Stack({ className, width = 320 }: StackProps) {
  const height = Math.round((width * 1164.12) / 388.38);
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/svg/stack.svg"
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      className={className}
    />
  );
}
