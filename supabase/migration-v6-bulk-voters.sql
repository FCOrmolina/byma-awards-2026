-- ============================================================================
-- BYMA 2026 — Migration v6: bulk upload de votantes desde BYMA 2026.xlsx
-- ============================================================================
-- 1) Inserta/actualiza correos en allowed_emails (role=voter)
-- 2) Limpia asignaciones previas SOLO de estos correos
-- 3) Asigna cada votante a sus categorías específicas
--
-- 44 votantes únicos · 47 asignaciones · 28 categorías cubiertas
-- ============================================================================

-- ─── 1. allowed_emails ───────────────────────────────────────────────────────
insert into public.allowed_emails (email, full_name, role) values
  ('aarce@zignia.mx', 'ALEJANDRO ARCE', 'voter'),
  ('aarroyo@ticketmaster.com.mx', 'ANA MARIA (TICKETMASTER)', 'voter'),
  ('adriana.restrepo@ifpi.org', 'ADRIANA RESTREPO (IFPI)', 'voter'),
  ('alexarmas@estudio13.com.mx', 'ESTUDIO 13', 'voter'),
  ('antonioesquinca@yahoo.com.mx', 'TOÑO ESQUINCA', 'voter'),
  ('arodriguez@fcogroup.mx', 'ALBERTO', 'voter'),
  ('carlos.lara@mac.com', 'CARLOS LARA', 'voter'),
  ('charlie.garcia@sonymusic.com', 'CHARLIE GARCÍA SONY', 'voter'),
  ('cibrianko@gmail.com', 'KIKO CIBRIÁN', 'voter'),
  ('contact@susvasquez.com', 'SUS VÁSQUEZ', 'voter'),
  ('daniel.miranda@musicvibe.mx', 'DANIEL MIRANDA (MUSIC VIBE)', 'voter'),
  ('dirgeneral@sacm.org.mx', 'ROBERTO CANTORAL', 'voter'),
  ('enrique@panoram.com.mx', 'ENRIQUE (PANORAM)', 'voter'),
  ('ernestofernandezproduction@gmail.com', 'NETO FERNÁNDEZ', 'voter'),
  ('federico@crack.com.mx', 'FEDERICO PONCE DE LEÓN', 'voter'),
  ('gabo.llano@bytedance.com', 'GABRIEL LLANO', 'voter'),
  ('gamamikaela@gmail.com', 'MARÍA LEÓN', 'voter'),
  ('gil.montero@solidorecords.com', 'GIL MONTERO (DALE PLAY)', 'voter'),
  ('gking@amprofon.com.mx', 'GUILLERMO KING (AMPROFON)', 'voter'),
  ('gustavogutierrez@onerpm.com', 'GUSTAVO GUTIÉRREZ (ONERPM)', 'voter'),
  ('holasoyrenee8@gmail.com', 'RENEÉ', 'voter'),
  ('javier@medusamusiclab.com', 'JAVIER PANIAGUA', 'voter'),
  ('jfaraon@livehouseent.com', 'LIVE HOUSE ENTERTAINMENT', 'voter'),
  ('jjuarez@westwoodent.com', 'JORGE JUÁREZ (WESTWOOD)', 'voter'),
  ('junior@rimasmusic.com', 'JUNIOR CARABAÑO', 'voter'),
  ('junior@rimasmusic.com
sfernandes@rimasmusic.com', 'RIMAS ENTERTAINMENT', 'voter'),
  ('l.skipsey@yahoo.com', 'LOURDES SKIPSEY', 'voter'),
  ('lguss@ocesa.mx', 'LEIZER GUSS (OCESA)', 'voter'),
  ('marco.catano@umusic.com
alfredo.delgadillo@umusic.com
fernando.venegas@umusic.com', 'UNIVERSAL MUSIC MEXICO', 'voter'),
  ('mateoverdugo2@gmail.com', 'MATEO VERDUGO', 'voter'),
  ('michelle.alberty@paramount.com', 'MICHELLE ALBERTY', 'voter'),
  ('mmartinezd@ocesa.mx', 'MARIA FERNANDA (OCESA)', 'voter'),
  ('monterreysound@gmail.com', 'ABELARDO RIVERA', 'voter'),
  ('monterreysoundrecords@gmail.com', 'MARCELO RIVERA LEVY', 'voter'),
  ('pepehernandezmusic@gmail.com', 'PEPE HERNÁNDEZ', 'voter'),
  ('pforat@amazon.com', 'PAUL FORAT (AMAZON)', 'voter'),
  ('ricardo@lolamusic.us', 'RICARDO RICHI LÓPEZ', 'voter'),
  ('roberto.lopez@sonymusic.com
jorge.chiwo@sonymusic.com', 'SONY MUSIC MEXICO', 'voter'),
  ('rolando.rios@bytedance.com', 'ROLANDO RÍOS (TIKTOK)', 'voter'),
  ('sdiaz@theorchard.com', 'SANDIVEL THE ORCHARD', 'voter'),
  ('sopitas@sopitas.com', 'FRANCISCO SOPITAS', 'voter'),
  ('startmonica@gmail.com', 'MÓNICA VÉLEZ', 'voter'),
  ('tomas.rodriguez@warnermusic.com', 'WARNER MUSIC MEXICO', 'voter'),
  ('vgonzalez@peermusic.com', 'VIRIDIANA (PEER MUSIC)', 'voter')
on conflict (email) do update
  set full_name = excluded.full_name,
      role      = excluded.role;

-- ─── 2. limpia asignaciones previas de SOLO estos correos ───────────────────
delete from public.allowed_email_categories
where email in (
  'aarce@zignia.mx',
  'aarroyo@ticketmaster.com.mx',
  'adriana.restrepo@ifpi.org',
  'alexarmas@estudio13.com.mx',
  'antonioesquinca@yahoo.com.mx',
  'arodriguez@fcogroup.mx',
  'carlos.lara@mac.com',
  'charlie.garcia@sonymusic.com',
  'cibrianko@gmail.com',
  'contact@susvasquez.com',
  'daniel.miranda@musicvibe.mx',
  'dirgeneral@sacm.org.mx',
  'enrique@panoram.com.mx',
  'ernestofernandezproduction@gmail.com',
  'federico@crack.com.mx',
  'gabo.llano@bytedance.com',
  'gamamikaela@gmail.com',
  'gil.montero@solidorecords.com',
  'gking@amprofon.com.mx',
  'gustavogutierrez@onerpm.com',
  'holasoyrenee8@gmail.com',
  'javier@medusamusiclab.com',
  'jfaraon@livehouseent.com',
  'jjuarez@westwoodent.com',
  'junior@rimasmusic.com',
  'junior@rimasmusic.com
sfernandes@rimasmusic.com',
  'l.skipsey@yahoo.com',
  'lguss@ocesa.mx',
  'marco.catano@umusic.com
alfredo.delgadillo@umusic.com
fernando.venegas@umusic.com',
  'mateoverdugo2@gmail.com',
  'michelle.alberty@paramount.com',
  'mmartinezd@ocesa.mx',
  'monterreysound@gmail.com',
  'monterreysoundrecords@gmail.com',
  'pepehernandezmusic@gmail.com',
  'pforat@amazon.com',
  'ricardo@lolamusic.us',
  'roberto.lopez@sonymusic.com
jorge.chiwo@sonymusic.com',
  'rolando.rios@bytedance.com',
  'sdiaz@theorchard.com',
  'sopitas@sopitas.com',
  'startmonica@gmail.com',
  'tomas.rodriguez@warnermusic.com',
  'vgonzalez@peermusic.com'
);

-- ─── 3. asigna categorías ───────────────────────────────────────────────────
insert into public.allowed_email_categories (email, category_id)
select v.email, c.id
from (values
  ('aarce@zignia.mx', 'gira-del-ano'),
  ('aarroyo@ticketmaster.com.mx', 'gira-del-ano'),
  ('adriana.restrepo@ifpi.org', 'label-del-ano'),
  ('alexarmas@estudio13.com.mx', 'productor-rock-del-ano'),
  ('antonioesquinca@yahoo.com.mx', 'agente-de-cambio'),
  ('arodriguez@fcogroup.mx', 'mejor-artista-estrategia-digital'),
  ('carlos.lara@mac.com', 'compositor-del-ano'),
  ('charlie.garcia@sonymusic.com', 'artista-mayor-impacto-cultural'),
  ('cibrianko@gmail.com', 'mejor-direccion-musical'),
  ('contact@susvasquez.com', 'musico-del-ano'),
  ('daniel.miranda@musicvibe.mx', 'mejor-venue'),
  ('dirgeneral@sacm.org.mx', 'manager-del-ano'),
  ('enrique@panoram.com.mx', 'mejor-ingeniero-de-audio'),
  ('enrique@panoram.com.mx', 'productor-pop-del-ano'),
  ('ernestofernandezproduction@gmail.com', 'estudio-grabacion-del-ano'),
  ('federico@crack.com.mx', 'promotora-del-ano'),
  ('gabo.llano@bytedance.com', 'mejor-campana-marketing'),
  ('gamamikaela@gmail.com', 'lider-conversacion-musical'),
  ('gil.montero@solidorecords.com', 'mejor-ar'),
  ('gking@amprofon.com.mx', 'ejecutivo-del-ano'),
  ('gustavogutierrez@onerpm.com', 'accion-de-streaming-del-ano'),
  ('holasoyrenee8@gmail.com', 'productor-rock-del-ano'),
  ('javier@medusamusiclab.com', 'accion-de-streaming-del-ano'),
  ('javier@medusamusiclab.com', 'manager-del-ano'),
  ('jfaraon@livehouseent.com', 'mejor-venue'),
  ('jjuarez@westwoodent.com', 'promotora-del-ano'),
  ('junior@rimasmusic.com', 'productor-urbano-del-ano'),
  ('junior@rimasmusic.com
sfernandes@rimasmusic.com', 'label-del-ano'),
  ('l.skipsey@yahoo.com', 'experiencia-show-en-vivo'),
  ('lguss@ocesa.mx', 'festival-del-ano'),
  ('marco.catano@umusic.com
alfredo.delgadillo@umusic.com
fernando.venegas@umusic.com', 'label-del-ano'),
  ('mateoverdugo2@gmail.com', 'trend-musical-del-ano'),
  ('michelle.alberty@paramount.com', 'mejor-direccion-audiovisual'),
  ('mmartinezd@ocesa.mx', 'experiencia-show-en-vivo'),
  ('monterreysound@gmail.com', 'mejor-ingeniero-de-audio'),
  ('monterreysoundrecords@gmail.com', 'productor-regional-del-ano'),
  ('monterreysoundrecords@gmail.com', 'productor-urbano-del-ano'),
  ('pepehernandezmusic@gmail.com', 'mejor-direccion-musical'),
  ('pforat@amazon.com', 'agregadora-del-ano'),
  ('ricardo@lolamusic.us', 'productor-pop-del-ano'),
  ('roberto.lopez@sonymusic.com
jorge.chiwo@sonymusic.com', 'label-del-ano'),
  ('rolando.rios@bytedance.com', 'trend-musical-del-ano'),
  ('sdiaz@theorchard.com', 'mejor-artista-estrategia-digital'),
  ('sopitas@sopitas.com', 'artista-mayor-impacto-cultural'),
  ('startmonica@gmail.com', 'compositor-del-ano'),
  ('tomas.rodriguez@warnermusic.com', 'label-del-ano'),
  ('vgonzalez@peermusic.com', 'agregadora-del-ano')
) as v(email, slug)
join public.categories c on c.slug = v.slug
on conflict do nothing;
