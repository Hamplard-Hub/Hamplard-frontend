# Testimonials Carousel - Quick Start Guide

## 🚀 Quick Implementation

### 1. Import the Component
```tsx
import { TestimonialsCarousel, type Testimonial } from '@/components/home';
```

### 2. Prepare Your Data
```tsx
const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'John Doe',
    role: 'Professional Baker',
    courseTaken: 'Advanced Baking Course',
    quote: 'This course changed my career!',
    rating: 5,
    avatarUrl: 'https://example.com/avatar.jpg', // Optional
  },
  // Add more testimonials...
];
```

### 3. Use the Component
```tsx
<TestimonialsCarousel testimonials={testimonials} />
```

## 📋 Data Interface

```typescript
interface Testimonial {
  id: string;              // Unique identifier (required)
  name: string;            // Student's full name (required)
  role: string;            // Professional title (required)
  courseTaken: string;     // Course name (required)
  quote: string;           // Testimonial text (required)
  rating: number;          // 1-5 star rating (required)
  avatarUrl?: string | null; // Profile image URL (optional)
}
```

## ⚙️ Props (All Optional)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `testimonials` | `Testimonial[]` | **Required** | Array of testimonials |
| `autoAdvanceInterval` | `number` | `5000` | Auto-advance timing (ms) |
| `heading` | `string` | `"What Our Students Say"` | Section heading |
| `subtitle` | `string` | Default text | Section subtitle |

## 🎯 Features at a Glance

### ✅ Auto-Advance
- Cycles every 5 seconds by default
- Pauses on hover
- Disabled for users who prefer reduced motion

### ✅ Navigation
- **Previous/Next buttons**: Arrow buttons on sides
- **Dot navigation**: Click dots to jump to any testimonial
- **Keyboard**: Use Left/Right arrow keys

### ✅ Responsive
- **Desktop (lg+)**: Shows 3 testimonials
- **Tablet (md)**: Shows 2 testimonials
- **Mobile**: Shows 1 testimonial

### ✅ Accessible
- ARIA labels on all controls
- Screen reader announcements
- Keyboard navigation
- Focus indicators
- Respects motion preferences

## 🎨 Customization Examples

### Faster Auto-Advance (3 seconds)
```tsx
<TestimonialsCarousel 
  testimonials={data}
  autoAdvanceInterval={3000}
/>
```

### Custom Heading
```tsx
<TestimonialsCarousel 
  testimonials={data}
  heading="Success Stories"
  subtitle="From students around the world"
/>
```

### No Auto-Advance (Manual Only)
Set a very high interval or check for reduced motion:
```tsx
<TestimonialsCarousel 
  testimonials={data}
  autoAdvanceInterval={999999999}
/>
```

## 💡 Best Practices

### Data Preparation
1. **Use real testimonials** - Authentic feedback builds trust
2. **Vary the length** - Mix short and longer quotes
3. **Include avatars** - Images increase credibility
4. **Show diversity** - Represent different courses and backgrounds
5. **Keep quotes positive** - Focus on success stories

### Number of Testimonials
- **Minimum**: 3 (fills one desktop view)
- **Recommended**: 6-12 (provides variety without overwhelming)
- **Maximum**: No limit, but 15-20 is ideal

### Quote Length
- **Ideal**: 100-200 characters
- **Maximum**: 300 characters for readability
- **Avoid**: Very short quotes (<50 chars) may look empty

### Avatar Images
- **Size**: 150x150px minimum (component displays at 48-56px)
- **Format**: JPG or PNG
- **Fallback**: Component shows initials if no image provided
- **Alt text**: Auto-generated from name

## 🧪 Testing Checklist

### Functionality
- [ ] Auto-advance works every 5 seconds
- [ ] Hover pauses auto-advance
- [ ] Previous/Next buttons cycle correctly
- [ ] Dot navigation jumps to correct slide
- [ ] Keyboard arrows work (Left/Right)

### Responsive
- [ ] 1 testimonial on mobile
- [ ] 2 testimonials on tablet
- [ ] 3 testimonials on desktop
- [ ] Layout doesn't break at edge cases

### Accessibility
- [ ] Screen reader announces slides
- [ ] All buttons have labels
- [ ] Keyboard navigation works
- [ ] Focus visible on all controls
- [ ] Reduced motion disables auto-advance

## 🐛 Troubleshooting

### Auto-Advance Not Working
1. Check if you have 2+ testimonials
2. Verify browser doesn't have reduced motion enabled
3. Make sure carousel isn't being hovered
4. Check console for JavaScript errors

### Layout Issues
1. Ensure parent container has proper width
2. Check for conflicting CSS
3. Verify Tailwind classes are compiling
4. Test at different screen sizes

### Images Not Showing
1. Verify `avatarUrl` is valid URL
2. Check CORS settings if external images
3. Test with public image URLs
4. Ensure images are accessible

### Typescript Errors
1. Import the `Testimonial` type
2. Ensure all required fields are provided
3. Check rating is a number (1-5)
4. Verify id is unique string

## 📦 File Locations

```
src/
├── components/
│   └── home/
│       ├── TestimonialsCarousel.tsx      # Main component
│       ├── TestimonialsCarousel.stories.tsx  # Storybook examples
│       └── index.ts                       # Export
└── app/
    └── page.tsx                          # Homepage integration
```

## 🔗 Related Documentation

- Full Implementation: `TESTIMONIALS-CAROUSEL-IMPLEMENTATION.md`
- Storybook Examples: Run `npm run storybook`
- Component API: See TypeScript definitions

## 💬 Support

For issues or questions:
1. Check the full implementation guide
2. Review Storybook examples
3. Test with sample data first
4. Verify all requirements are met

---

**Last Updated**: Issue #166 Implementation  
**Component Version**: 1.0.0  
**Status**: ✅ Production Ready
