import { useEffect, useMemo, useState } from 'react';
import { Search, Upload, Images } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import DishImage from '../../components/DishImage';
import { primeImage } from '../../lib/imageCache';

// Search-by-name picker over the bundled library + the owner's uploads.
export default function ImagePickerModal({ open, onClose, onSelect }) {
  const toast = useToast();
  const [library, setLibrary] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      setQuery('');
      window.vizo.images.library().then((res) => {
        if (res.ok) setLibrary(res.images);
      });
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return library;
    return library.filter((img) => img.name.toLowerCase().includes(q));
  }, [library, query]);

  async function onUpload() {
    try {
      const res = await window.vizo.images.upload();
      if (!res.ok) {
        toast(res.error || 'Upload failed.', 'danger');
        return;
      }
      if (res.canceled) return;
      primeImage(res.ref, res.dataUrl);
      onSelect(res.ref);
      toast('Photo added.', 'success');
    } catch (err) {
      toast(`Upload failed: ${err.message}`, 'danger');
    }
  }

  return (
    <Modal open={open} title="Choose Dish Photo" onClose={onClose} maxWidth={640}>
      <div className="picker">
        <div className="picker__bar">
          <div className="manage__search picker__search">
            <Search size={16} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search by name — try "biryani"'
            />
          </div>
          <Button onClick={onUpload}>
            <Upload size={16} /> Upload my own
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <Images size={36} />
            {library.length === 0 ? (
              <p>
                The photo library is empty. Put image files in{' '}
                <code>resources\dish-images</code> (e.g. <code>chicken-biryani.jpg</code>) or
                upload your own photo.
              </p>
            ) : (
              <p>No photo matches "{query}".</p>
            )}
          </div>
        ) : (
          <div className="picker__grid">
            {filtered.map((img) => (
              <button
                key={img.ref}
                type="button"
                className="picker__tile"
                onClick={() => onSelect(img.ref)}
                title={img.name}
              >
                <DishImage imgRef={img.ref} className="picker__img" alt={img.name} />
                <span className="picker__name">{img.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
