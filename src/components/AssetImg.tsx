import { useEffect, useState } from 'react';
import { db } from '../db';

export function AssetImg({ id, alt = '' }: { id: string | null; alt?: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let u: string | undefined;
    if (id) db.assets.get(id).then((a) => { if (a) { u = URL.createObjectURL(a.blob); setUrl(u); } });
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [id]);
  return url ? <img className="qimg" src={url} alt={alt} /> : null;
}
