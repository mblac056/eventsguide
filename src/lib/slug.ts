export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'board';
}

export function uniqueSlugs<T extends { id: string; name: string }>(
  files: T[],
): (T & { slug: string })[] {
  const used = new Set<string>();
  const slugById = new Map<string, string>();

  const byId = [...files].sort((a, b) => a.id.localeCompare(b.id));
  for (const file of byId) {
    const base = slugify(file.name);
    let slug = base;
    if (used.has(slug)) {
      const prefix = file.id.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6);
      slug = `${base}-${prefix || 'id'}`;
      let n = 2;
      while (used.has(slug)) {
        slug = `${base}-${prefix}${n}`;
        n += 1;
      }
    }
    used.add(slug);
    slugById.set(file.id, slug);
  }

  return files.map((file) => ({ ...file, slug: slugById.get(file.id) ?? slugify(file.name) }));
}
