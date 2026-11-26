/**
 * components-demo — developer showcase page.
 *
 * Server Component wrapper.  Returns 404 in production so the page is never
 * reachable on the live domain.  In development the interactive client
 * component (ComponentsDemoClient) is rendered as normal.
 */
import { notFound } from 'next/navigation';
import ComponentsDemoClient from './ComponentsDemoClient';

export default function ComponentsDemoPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <ComponentsDemoClient />;
}
