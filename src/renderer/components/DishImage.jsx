import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getImage } from '../lib/imageCache';

// Renders a dish image from a library/user ref, with a quiet placeholder
// when the item has no image (or the file was removed).
export default function DishImage({ imgRef, alt = '', className }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setUrl(null);
    setFailed(false);
    if (!imgRef) {
      setFailed(true);
      return;
    }
    getImage(imgRef).then((u) => {
      if (!alive) return;
      if (u) setUrl(u);
      else setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [imgRef]);

  if (failed || !url) {
    return (
      <div className={`dish-image dish-image--empty ${className || ''}`}>
        <ImageOff size={18} />
      </div>
    );
  }
  return <img className={`dish-image ${className || ''}`} src={url} alt={alt} draggable="false" />;
}
