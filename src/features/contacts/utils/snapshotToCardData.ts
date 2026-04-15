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
      instagram:    snapshot.links?.instagram    ?? '',
      github:       snapshot.links?.github       ?? '',
      website:      snapshot.links?.website      ?? '',
      linkedin:     snapshot.links?.linkedin     ?? '',
      google_drive: snapshot.links?.google_drive ?? '',
    },
    profile_url: snapshot.profile_url ?? null,
    logo_url:    snapshot.logo_url    ?? null,
    theme:       snapshot.theme       ?? null,
    back_theme:  snapshot.back_theme  ?? null,
  };
}
