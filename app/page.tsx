import cafesData from '@/data/cafes.json';
import { Cafe } from '@/types/cafe';
import MapSectionWrapper from '@/components/MapSectionWrapper';

const cafes = cafesData as Cafe[];

export default function HomePage() {
  return (
    <main>
      <MapSectionWrapper cafes={cafes} />
    </main>
  );
}
