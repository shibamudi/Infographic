import GalleryPage from 'components/Gallery/GalleryPage';
import {AIPageContent} from 'components/AIPlayground';
import { LanguageSwitcher } from 'components/LanguageSwitcher';

export default function Home() {
  return (
    <>
      <div className='absolute top-0 right-0 m-4 z-20'>
        <LanguageSwitcher />
      </div>
      <AIPageContent />
      <GalleryPage />
    </>
  );
}
