-- ============================================================================
-- BYMA 2026 — Migration v4: actualizar nombres y descripciones de categorías
-- ============================================================================
-- Sincroniza con la versión más reciente del PDF de nominados (rev. junio 2026).
-- Usa UPDATE por slug — no toca IDs, candidatos ya propuestos siguen vivos.
--
-- Pegar TODO esto en Supabase SQL Editor → Run.
-- ============================================================================

-- ─── MAKERS ──────────────────────────────────────────────────────────────────

update public.categories set description =
  'Reconoce la excelencia autoral de compositores o letristas que han tenido un impacto destacado en la música en español. Composiciones registradas bajo su autoría principal. Voces artísticas sólidas, versátiles y significativas dentro del panorama musical actual.'
where slug = 'compositor-del-ano';

update public.categories set description =
  'Reconoce la excelencia en la concepción y realización audiovisual de proyectos musicales: videoclips en español, contenido digital y piezas cinematográficas que amplían el universo de una canción más allá del sonido. Narrativa, estética y capacidad de impacto como criterios centrales.'
where slug = 'mejor-direccion-audiovisual';

-- ─── PLAYERS ─────────────────────────────────────────────────────────────────

update public.categories set description =
  'Reconoce a líderes de la industria musical cuyas decisiones estratégicas, visión de negocio y capacidad de desarrollo empresarial han tenido un impacto medible en el ecosistema de la música de habla hispana durante el último año.'
where slug = 'ejecutivo-del-ano';

update public.categories set description =
  'Reconoce al sello discográfico (major, emergente o independiente) que en el último año ha demostrado mayor liderazgo en el desarrollo artístico, posicionamiento local e internacional, publishing, distribución y marketing de la música en español.'
where slug = 'label-del-ano';

update public.categories set description =
  'Reconoce las mejores prácticas de promotoría de música en vivo que han demostrado un trabajo destacado en la creación de experiencias memorables para los públicos, participando en la organización, producción de conciertos, giras, festivales o eventos musicales de alto nivel.'
where slug = 'promotora-del-ano';

update public.categories set description =
  'Reconoce a los profesionales de A&R (Artista y Repertorio) que han tenido la visión estratégica, sensibilidad artística y la contribución real al crecimiento de proyectos musicales relevantes.'
where slug = 'mejor-ar';

-- ─── DISTRIBUTION ────────────────────────────────────────────────────────────

update public.categories set description =
  'Reconoce a la empresa de distribución digital que en el último año ha demostrado mayor liderazgo en el acceso, desarrollo y posicionamiento de artistas dentro del mercado hispanohablante: infraestructura, transparencia, herramientas efectivas de monetización, soporte técnico y acompañamiento estratégico.'
where slug = 'agregadora-del-ano';

update public.categories set description =
  'Reconoce los fenómenos musicales que han generado un alto impacto digital, cultural y social, convirtiéndose en movimientos virales que han influido en el comportamiento de audiencias, artistas y plataformas, contribuyendo a definir el año musical desde una perspectiva de consumo, creación o interacción digital.'
where slug = 'trend-musical-del-ano';

update public.categories set description =
  'Reconoce a aquellas personas, medios o plataformas que desde su voz y perspectiva única influyen en la conversación y opinión de la industria musical. Son un canal que enriquece la forma en que conocemos, entendemos y vivimos la experiencia musical de habla hispana.'
where slug = 'lider-conversacion-musical';

-- ─── LIVE ────────────────────────────────────────────────────────────────────

update public.categories set description =
  'Reconoce a las giras de conciertos que han destacado por su alcance territorial, calidad de producción, poder de convocatoria y relevancia cultural, consolidándose como un modelo de negocio valioso. Celebra a quienes hacen posible estos proyectos y garantizan la consistencia del espectáculo así como la proyección del artista.'
where slug = 'gira-del-ano';

update public.categories set description =
  'Reconoce a los responsables de construir, arreglar y liderar la propuesta musical de una gira o show en vivo. Valora el trabajo del director musical como figura clave en la traducción del sonido del estudio al escenario: adapta arreglos, selecciona músicos y garantiza la calidad sonora y cohesión de la presentación en vivo.'
where slug = 'mejor-direccion-musical';

-- ─── IMPACT ──────────────────────────────────────────────────────────────────

update public.categories set description =
  'Reconoce al artista cuya obra, presencia pública y narrativa han trascendido el ámbito musical para generar conversación, influencia y transformación cultural en el último año. El impacto no como popularidad, sino como una herramienta para moldear el pensamiento, generar nuevos negocios o incursionar en otras formas de arte.'
where slug = 'artista-mayor-impacto-cultural';

-- ⚠ Cambio de nombre (mismo slug, mismo significado)
update public.categories
  set name = 'Agente de causa social'
where slug = 'agente-de-cambio';
