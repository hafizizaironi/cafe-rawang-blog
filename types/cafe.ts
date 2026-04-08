export type PlaceType = 'cafe' | 'stall';

export interface Cafe {
  id: string;
  slug: string;
  name: string;
  neighborhood: string;
  type: PlaceType;
  lat: number;
  lng: number;
  tagline: string;
  hours: string;
  vibeTags: string[];
  description: string;
  photos: string[];
}
