import type { ReceivedCardSnapshot } from '../types';
import type { CardData } from '../../cards/types';

export function snapshotToCardData(snapshot: ReceivedCardSnapshot): Omit<CardData, 'id'> {
  return {
    display_name: snapshot.display_name ?? '',
    headline: snapshot.headline ?? '',
    organization: snapshot.organization ?? '',
    email: snapshot.email ?? '',
    phone: snapshot.phone ?? '',
    links: {
      instagram: snapshot.links?.instagram ?? '',
      github: snapshot.links?.github ?? '',
      website: snapshot.links?.website ?? '',
    },
    style: {
      template_id: (snapshot.style?.template_id as 1 | 2) ?? 1,
      theme_color: snapshot.style?.theme_color ?? '#111827',
      font_family: (snapshot.style?.font_family as any) ?? 'sans',
      orientation: (snapshot.style?.orientation as any) ?? 'horizontal',
    },
    profile_url: snapshot.profile_url ?? null,
    logo_url: snapshot.logo_url ?? null,
    theme: snapshot.theme ?? null,
  };
}
