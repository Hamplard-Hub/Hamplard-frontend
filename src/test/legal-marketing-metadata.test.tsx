import { describe, it, expect } from 'vitest';
import { metadata as privacyMetadata } from '@/app/privacy/layout';
import { metadata as termsMetadata } from '@/app/terms/layout';
import { metadata as teachMetadata } from '@/app/teach/layout';
import { metadata as teamsMetadata } from '@/app/teams/layout';
import { metadata as contactMetadata } from '@/app/contact/layout';

describe('Legal and Marketing Pages Metadata (#613)', () => {
  it('defines unique titles and canonical URLs for /privacy, /terms, /teach, /teams, and /contact', () => {
    expect(privacyMetadata.title).toBe('Privacy Policy');
    expect(privacyMetadata.alternates?.canonical).toContain('/privacy');

    expect(termsMetadata.title).toBe('Terms of Service');
    expect(termsMetadata.alternates?.canonical).toContain('/terms');

    expect(teachMetadata.title).toBe('Teach on Hamplard');
    expect(teachMetadata.alternates?.canonical).toContain('/teach');

    expect(teamsMetadata.title).toBe('Hamplard for Teams');
    expect(teamsMetadata.alternates?.canonical).toContain('/teams');

    expect(contactMetadata.title).toBe('Contact Us');
    expect(contactMetadata.alternates?.canonical).toContain('/contact');
  });
});
