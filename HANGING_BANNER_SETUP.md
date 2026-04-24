# 3D Hanging Banner System - Setup & Usage Guide

## Overview
A complete 3D animated hanging banner system with GSAP animations, rope effects, and admin controls. Banners drop down smoothly with customizable text, colors, duration, and font sizes.

## Components Created

### 1. **HangingBanner3D.tsx** (`src/components/home/HangingBanner3D.tsx`)
The core 3D banner component featuring:
- GSAP timeline-based animations
- Rope dropping animation
- Banner 3D rotation and fade-in
- Gentle sway and bounce effects
- Smooth fade-out after configured duration
- Pure CSS styling with gradients and shadows
- TypeScript type safety

**Features:**
- Configurable text, colors, font size, and weight
- 3D perspective and transform effects
- Realistic rope styling with shadows
- Customizable display duration (5-60 seconds)
- Callback on animation completion

### 2. **HangingBannerContainer.tsx** (`src/components/home/HangingBannerContainer.tsx`)
A wrapper component that:
- Fetches banner settings from Supabase via `useBannerSettings` hook
- Manages banner visibility state
- Handles real-time updates
- Shows banner only when active

### 3. **useBannerSettings.ts** (`src/hooks/useBannerSettings.ts`)
Custom React hook providing:
- Fetches active banner from Supabase
- Real-time subscription for live updates
- Default banner fallback
- Loading and error states
- Type-safe BannerConfig interface

### 4. **AdminBannerManager.tsx** (`src/pages/admin/tabs/AdminBannerManager.tsx`)
Admin panel tab featuring:
- **Create/Edit Banners**: Form with all customization options
- **Live Preview**: See banner animation in real-time
- **Duration Control**: Quick select buttons (5s, 10s, 15s, 20s, 30s, 45s, 60s)
- **Font Size Options**: 18px to 42px
- **Font Weight**: normal, bold, bolder
- **Color Presets**: 8 pre-configured color combinations (EBSUMSA Green, Red, Blue, etc.)
- **Custom Colors**: Color pickers for custom background and text colors
- **Banner List**: Table showing all banners with status and actions
- **Activate/Deactivate**: Only one banner can be active at a time
- **Edit/Delete**: Full CRUD operations

### 5. **Database Migration** (`scripts/01_create_hanging_banners_table.sql`)
Creates the `hanging_banners` table with:
- UUID primary key
- Text, duration, colors, font settings
- isActive status flag
- Timestamps (created, updated)
- Row-level security policies
- Indexes for performance

## Installation Steps

### Step 1: Run Database Migration
Execute the SQL migration to create the `hanging_banners` table:
```bash
# Via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Create new query
# 3. Paste contents from scripts/01_create_hanging_banners_table.sql
# 4. Click Run

# OR via CLI if configured:
supabase db push
```

### Step 2: GSAP Already Installed
GSAP has been added to your project dependencies (v3.x latest).

### Step 3: Integration Complete
- Admin tab "Hanging Banners" is already added to AdminDashboard
- HangingBannerContainer is integrated into Home page
- All components are imported and wired up

## Usage Guide

### Admin Panel Access
1. Navigate to Admin Dashboard
2. Click "Hanging Banners" tab (purple button)
3. Create or manage banners

### Creating a Banner
1. **Fill in Banner Text**: e.g., "Merry Christmas 🎄"
2. **Select Duration**: Choose how long banner displays (5-60 seconds)
3. **Choose Size**: Pick font size (18px-42px)
4. **Pick Colors**: 
   - Use preset colors for quick selection
   - Or use custom color pickers
5. **Preview**: Click "Show Preview" to see animation
6. **Save**: Click "Create Banner"

### Activating a Banner
1. In the Banners list table
2. Click the status badge to toggle Active/Inactive
3. Only one banner can be active at a time
4. When activated, it will immediately display on home page

### Editing a Banner
1. Find banner in table
2. Click "Edit" button
3. Update settings
4. Click "Update Banner"

### Deleting a Banner
1. Find banner in table
2. Click "Delete" button
3. Confirm deletion

## Animation Timeline Breakdown

The banner follows this sequence:
```
0-0.6s:   Ropes drop down (scaleY: 0 → 1)
0.2-0.9s: Banner drops with 3D rotation (y: -200 → 0, rotationX: 45 → 0)
1.2-END:  Gentle sway motion (duration-2 seconds)
         Side-to-side movement with rope rotation
END-END+0.8s: Fade out (opacity: 1 → 0)
```

## Customization

### Change Rope Color
In `HangingBanner3D.tsx`, find the rope div background:
```typescript
background: 'linear-gradient(180deg, #8B4513 0%, #A0522D 50%, #8B4513 100%)'
```
Change hex codes to your preferred rope color.

### Adjust Animation Speed
Modify GSAP timeline durations in the `useEffect` hook.

### Change Rope Width
Modify the `width` property (currently 3px) in rope div styling.

### Adjust Sway Distance
Modify the `x: 15` value for horizontal movement distance.

## TypeScript Interfaces

```typescript
interface BannerConfig {
  id?: string;
  text: string;
  duration: number;           // 5-60 seconds
  bgColor: string;            // hex color
  textColor: string;          // hex color
  fontSize: number;           // 18-48px
  fontWeight: 'normal' | 'bold' | 'bolder';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

## Browser Compatibility

- Chrome/Edge: Full support (3D transforms, GSAP)
- Firefox: Full support
- Safari: Full support
- Mobile: Fully responsive and animated

## Performance Notes

- GSAP timeline is killed on component unmount
- Banner uses CSS transforms (GPU accelerated)
- No layout shifts during animation
- Minimal re-renders with proper state management
- Real-time updates via Supabase subscriptions

## Troubleshooting

**Banner not showing on home page?**
- Check if banner is set to `isActive: true` in admin
- Check browser console for errors
- Verify Supabase connection

**Animation looks choppy?**
- Check browser performance tab
- Disable other animations temporarily
- Clear browser cache

**Preview in admin not working?**
- Ensure form is filled with valid data
- Click "Show Preview" button
- Check console for GSAP errors

## Future Enhancements

- Add banner scheduling (show on specific dates)
- Multiple banners queue system
- Animation template selection
- Banner analytics (impressions, clicks)
- Sound effects option
- Mobile-specific duration controls
