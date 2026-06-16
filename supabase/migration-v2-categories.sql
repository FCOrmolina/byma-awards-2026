-- ============================================================================
-- BYMA 2026 — Migration v2: categorías reales del manual oficial
-- ============================================================================
-- Cambios respecto a migration.sql:
--   1. Añade columna `bucket` a `categories` (MAKERS/PLAYERS/DISTRIBUTION/LIVE/IMPACT)
--   2. Borra placeholders y siembra las 28 categorías oficiales del PDF
--
-- Pegar TODO esto en Supabase SQL Editor → Run.
-- ============================================================================

-- 1. Columna bucket
alter table public.categories
  add column if not exists bucket text;

-- Limpia candidatos y categorías (estamos en setup, no hay datos en producción).
delete from public.candidates;
delete from public.categories;

alter table public.categories
  drop constraint if exists categories_bucket_check;

alter table public.categories
  add constraint categories_bucket_check
  check (bucket in ('MAKERS','PLAYERS','DISTRIBUTION','LIVE','IMPACT'));

alter table public.categories
  alter column bucket set not null;

-- 2. Siembra de las 28 categorías oficiales BYMA 2026
insert into public.categories (slug, name, description, color_key, bucket, sort_order) values

-- ─── MAKERS · construyen ──────────────────────────────────────────────────────
('compositor-del-ano',
 'Compositor del año',
 'Reconoce la excelencia autoral de compositores o letristas que han tenido un impacto destacado en la música en español. Composiciones registradas bajo su autoría principal, ya sea de forma individual o en coautoría. Voces artísticas sólidas, versátiles y significativas dentro del panorama musical actual.',
 'NARANJA', 'MAKERS', 1),

('productor-pop-del-ano',
 'Productor Pop del año',
 'Reconoce la visión artística, capacidad técnica, dirección creativa y consistencia en la creación de obras musicales dentro del género pop, tanto en sus vertientes tradicionales como contemporáneas.',
 'NARANJA', 'MAKERS', 2),

('productor-regional-del-ano',
 'Productor Regional del año',
 'Reconoce a productores musicales que han liderado el proceso creativo y técnico detrás de grabaciones que fortalecen, actualizan o expanden el panorama del género regional mexicano, tanto en el mercado tradicional como en nuevas audiencias.',
 'NARANJA', 'MAKERS', 3),

('productor-urbano-del-ano',
 'Productor Urbano del año',
 'Reconoce a productores musicales cuya dirección creativa, innovación sonora, capacidad de conexión con la audiencia y consistencia en la producción de obras musicales de género urbano han influido en la escena musical contemporánea.',
 'NARANJA', 'MAKERS', 4),

('productor-rock-del-ano',
 'Productor Rock del año',
 'Reconoce a productores musicales cuya dirección creativa y dominio técnico han definido el sonido del género rock en español en el último año, tanto en su expresión más clásica como en sus cruces con el alternativo y las fusiones contemporáneas.',
 'NARANJA', 'MAKERS', 5),

('mejor-direccion-audiovisual',
 'Mejor dirección audiovisual',
 'Reconoce la excelencia en la concepción y realización audiovisual de proyectos musicales: videoclips en español, contenido vertical y piezas cinematográficas que amplían el universo de una canción más allá del sonido. Narrativa, estética y capacidad de impacto como criterios centrales.',
 'NARANJA', 'MAKERS', 6),

('musico-del-ano',
 'Músico del año',
 'Reconoce a instrumentistas, arreglistas y ejecutantes que por su desempeño han aportado de forma sobresaliente a la música por medio de su sensibilidad artística, versatilidad y la relevancia de su participación, ya sea en grabaciones, presentaciones en vivo, colaboraciones destacadas o proyectos especiales.',
 'NARANJA', 'MAKERS', 7),

('estudio-grabacion-del-ano',
 'Estudio de grabación del año',
 'Reconoce a los estudios de grabación que han sido un punto clave en la creación de música, ofreciendo espacios técnicos, creativos y profesionales — no solo por la infraestructura, sino también por la capacidad para adaptarse a diversos géneros y proyectos, así como el catálogo de producciones realizadas y talento albergado.',
 'NARANJA', 'MAKERS', 8),

('mejor-ingeniero-de-audio',
 'Mejor ingeniero de audio',
 'Reconoce la excelencia técnica y artística de profesionales del audio cuyo trabajo ha sido determinante en la calidad sonora de producciones destacadas en el último año. Mezcla, masterización, grabación y diseño de sonido detrás de la experiencia auditiva del público sin importar el género musical.',
 'NARANJA', 'MAKERS', 9),

-- ─── PLAYERS · protegen el negocio ───────────────────────────────────────────
('ejecutivo-del-ano',
 'Ejecutivo del año',
 'Reconoce a líderes de la industria musical cuyas decisiones estratégicas, visión de negocio y capacidad de desarrollo artístico han tenido un impacto medible en el ecosistema de la música de habla hispana durante el último año.',
 'AZUL', 'PLAYERS', 10),

('label-del-ano',
 'Label del año',
 'Reconoce al sello discográfico (independiente o major) que en el último año ha demostrado mayor liderazgo en el desarrollo artístico, posicionamiento local e internacional, así como innovación en distribución y marketing dentro de la música en español.',
 'AZUL', 'PLAYERS', 11),

('promotora-del-ano',
 'Promotora del año',
 'Reconoce a las empresas promotoras de música en vivo que han demostrado un trabajo destacado en la creación de experiencias memorables para los públicos, participando en la organización y producción de conciertos, giras, festivales o eventos musicales de alto nivel.',
 'AZUL', 'PLAYERS', 12),

('mejor-ar',
 'Mejor A&R',
 'Reconoce a los profesionales de A&R (Artista y Repertorio) que han tenido la visión estratégica, sensibilidad artística y contribución real al crecimiento de proyectos musicales relevantes — identificando talento, construyendo propuestas artísticas sólidas y generando oportunidades creativas y comerciales dentro del mercado musical.',
 'AZUL', 'PLAYERS', 13),

('manager-del-ano',
 'Manager del año',
 'Reconoce al representante artístico que ha destacado por liderar la estrategia integral de desarrollo y crecimiento de su representado dentro de la industria musical. La visión estratégica, capacidad de negociación y el acompañamiento que han sido determinantes en el posicionamiento de sus artistas a nivel nacional e internacional.',
 'AZUL', 'PLAYERS', 14),

-- ─── DISTRIBUTION · distribuyen ──────────────────────────────────────────────
('accion-de-streaming-del-ano',
 'Acción de streaming del año',
 'Reconoce la iniciativa, función o actualización lanzada por una plataforma de streaming que en el último año ha tenido mayor impacto en la experiencia del oyente o en el ecosistema de la música en español: innovación tecnológica, mejoras de interfaz, calidad de audio o modelos de acceso que redefinen la relación entre música y audiencia.',
 'CREMA', 'DISTRIBUTION', 15),

('agregadora-del-ano',
 'Agregadora del año',
 'Reconoce a la empresa de distribución digital que en el último año ha demostrado mayor liderazgo en el acceso, desarrollo y posicionamiento de artistas independientes dentro del mercado hispanohablante: infraestructura, transparencia, herramientas efectivas de monetización, soporte técnico y acompañamiento estratégico.',
 'CREMA', 'DISTRIBUTION', 16),

('trend-musical-del-ano',
 'Trend musical del año',
 'Reconoce las piezas musicales que han generado un alto impacto digital, cultural y social, convirtiéndose en fenómenos virales que han influido en el comportamiento de audiencias, artistas y plataformas, contribuyendo a definir el año musical desde una perspectiva de consumo, creación o interacción digital.',
 'CREMA', 'DISTRIBUTION', 17),

('lider-conversacion-musical',
 'Líder de la conversación musical',
 'Reconoce a aquellas personas, medios o plataformas que desde su voz y perspectiva única influyen en la conversación de la industria musical. Son un canal que enriquece la forma en que entendemos, valoramos y vivimos la experiencia musical de habla hispana.',
 'CREMA', 'DISTRIBUTION', 18),

-- ─── LIVE · inspiran en vivo ─────────────────────────────────────────────────
('gira-del-ano',
 'Gira del año',
 'Reconoce a las giras de conciertos que han destacado por su alcance territorial, calidad de producción, poder de convocatoria y relevancia cultural, consolidándose como un modelo de negocio valioso. Celebra a quienes hacen posible estos proyectos y garantizan la conexión con el público, la consistencia del espectáculo y la proyección del artista.',
 'ROJO', 'LIVE', 19),

('festival-del-ano',
 'Festival del año',
 'Reconoce a los festivales que han marcado el ritmo del año con una curaduría artística centrada en la música de habla hispana, experiencia del asistente y su capacidad de convocatoria e impacto cultural dentro del ecosistema de la música como espacio de encuentro y expresión colectiva.',
 'ROJO', 'LIVE', 20),

('experiencia-show-en-vivo',
 'Experiencia de show en vivo',
 'Reconoce a los estudios, compañías y agencias responsables de la dirección creativa y/o técnica de espectáculos musicales en vivo que han elevado la experiencia escénica a través de una propuesta visual innovadora, una narrativa potente y una ejecución artística que fortalece la conexión entre artista y audiencia.',
 'ROJO', 'LIVE', 21),

('mejor-direccion-musical',
 'Mejor dirección musical',
 'Reconoce a los responsables de construir, arreglar y liderar la propuesta musical de una gira o show en vivo. Valora el trabajo del director musical como figura clave en la traducción del sonido del estudio al escenario: adapta arreglos, selecciona músicos, supervisa ensayos y garantiza la calidad sonora y cohesión de la presentación en vivo.',
 'ROJO', 'LIVE', 22),

('mejor-venue',
 'Mejor venue',
 'Reconoce a los recintos o espacios que han ofrecido las mejores condiciones para la realización de espectáculos musicales en vivo. Se valora su infraestructura, calidad de producción, experiencia del público y capacidad para albergar eventos de distintos formatos con altos estándares profesionales.',
 'ROJO', 'LIVE', 23),

-- ─── IMPACT · forjan un legado ───────────────────────────────────────────────
('artista-mayor-impacto-cultural',
 'Artista con mayor impacto cultural',
 'Reconoce la capacidad del artista para gestionar y potenciar su carrera de forma estratégica, desarrollar negocios innovadores y construir un legado empresarial relevante, combinando creatividad y liderazgo. Perfiles que han impactado más allá de la música.',
 'NEGRO', 'IMPACT', 24),

('mejor-artista-estrategia-digital',
 'Mejor artista con estrategia digital',
 'Reconoce a los artistas musicales que han destacado por su manejo estratégico, innovador y consistente de plataformas digitales para potenciar su carrera y fortalecer su conexión con la audiencia.',
 'NEGRO', 'IMPACT', 25),

('mejor-campana-marketing',
 'Mejor campaña de marketing',
 'Reconoce la campaña de marketing que, en colaboración directa con un artista musical, logró articular de manera sobresaliente los objetivos de marca, las audiencias y la identidad artística — siendo parte activa o central.',
 'NEGRO', 'IMPACT', 26),

('mejor-club-de-fans',
 'Mejor club de fans',
 'Reconoce a los clubes de fans que han movilizado a su comunidad, generando acciones significativas y fortaleciendo la conexión entre el artista y su audiencia. Motor clave en el impulso y visibilidad del artista al que apoyan por medio de comunicación disruptiva.',
 'NEGRO', 'IMPACT', 27),

('agente-de-cambio',
 'Agente de cambio',
 'Reconoce a los artistas musicales que han utilizado su visibilidad y plataforma para liderar o impulsar iniciativas con impacto social, ambiental o cultural significativo, demostrando un compromiso sostenido con causas relevantes.',
 'NEGRO', 'IMPACT', 28);
