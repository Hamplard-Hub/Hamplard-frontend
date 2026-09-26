'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function RouteAnnouncer() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setAnnouncement(`Navigated to ${document.title}`);
  }, [pathname]);

  return (
    <div aria-live="assertive" className="sr-only">
      {announcement}
    </div>
  );
}
