# Implementation Guide: Global Design System for Dialogs

## 📋 Overview

This guide shows you how to update both Personnel Dialog and Employee Profile Dialog to use your global design system instead of hardcoded colors.

## 🎨 Your Design System

**Primary Brand Color**: `cyan-500` = `rgb(45, 186, 237)` = `#2DBAED`

### CSS Variables (from `globals.css`)
```css
--primary: 196 81% 55%;           /* Your cyan brand color */
--primary-foreground: 0 0% 100%;  /* White text on primary */
--card: 0 0% 100%;                /* White card backgrounds */
--card-foreground: 222.2 84% 4.9%; /* Dark text on cards */
--muted: 210 40% 96%;             /* Light gray backgrounds */
--muted-foreground: 215.4 16.3% 46.9%; /* Gray text */
--border: 214.3 31.8% 91.4%;      /* Light gray borders */
```

### Tailwind Classes Available
- `bg-primary` - Your cyan brand color
- `text-primary` - Cyan text
- `bg-card` - White background
- `text-card-foreground` - Dark text
- `bg-muted` - Light gray background
- `text-muted-foreground` - Gray text
- `border-border` - Light gray border
- `text-primary-foreground` - White text

## 🔄 Color Replacements

### Complete Mapping Table

| Old Hardcoded Color | New Global Token | Usage |
|---------------------|------------------|-------|
| `from-cyan-500 via-blue-500 to-indigo-600` | `from-primary to-cyan-700` | Header gradient |
| `bg-white/20` (avatar) | `bg-card` | Avatar background |
| `text-white` (avatar icon) | `text-primary` | Avatar icon color |
| `text-cyan-100` | `text-primary-foreground/90` | Subtitle text |
| `from-cyan-500 to-blue-600` | `bg-primary` or `from-primary to-cyan-700` | Icon backgrounds |
| `bg-white` (cards) | `bg-card` | Card backgrounds |
| `border-2 border-cyan-100` | `border border-border` | Card borders |
| `text-cyan-600` | `text-primary` | Section labels |
| `bg-cyan-50` | `bg-muted` | Data backgrounds |
| `text-gray-700` | `text-foreground` | Body text |
| `text-gray-500` | `text-muted-foreground` | Subtle text |
| `bg-gray-50` | `bg-muted` | Content area background |

## 📁 Files Created

I've created 4 reference files in your project root:

1. **`GLOBAL_DESIGN_SYSTEM_GUIDE.md`** - Complete design system documentation
2. **`UPDATED_COLLECTOR_DIALOG.tsx`** - Full CollectorInfoDialog component using global tokens
3. **`UPDATED_EMPLOYEE_DIALOG.tsx`** - Full EmployeeProfileDialog component using global tokens
4. **`DIALOG_REDESIGN_GUIDE.md`** - Original redesign guide (for reference)

## 🚀 Implementation Steps

### Option 1: Copy & Replace (Recommended)

1. **For Orders Page Dialog:**
   ```bash
   # Open the updated component file
   code UPDATED_COLLECTOR_DIALOG.tsx
   
   # Copy the entire CollectorInfoDialog function
   # Replace lines 244-541 in:
   # src/app/(dashboard)/orders/page.tsx
   ```

2. **For Employees Page Dialog:**
   ```bash
   # Open the updated component file
   code UPDATED_EMPLOYEE_DIALOG.tsx
   
   # Copy the entire EmployeeProfileDialog function
   # Replace lines 110-331 in:
   # src/app/(dashboard)/employees/page.tsx
   ```

### Option 2: Manual Updates

If you prefer to update manually, follow these key changes:

#### 1. Header Gradient
```tsx
// OLD
<div className="relative bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 -m-6 mb-0 px-6 py-8">

// NEW
<div className="relative bg-gradient-to-r from-primary to-cyan-700 px-8 py-10">
```

#### 2. Avatar
```tsx
// OLD
<div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border-4 border-white/30">
  <Users className="h-10 w-10 text-white" />
</div>

// NEW
<div className="w-20 h-20 rounded-2xl bg-card backdrop-blur-sm flex items-center justify-center shadow-xl">
  <Users className="h-10 w-10 text-primary" />
</div>
```

#### 3. Text Colors
```tsx
// OLD
<h2 className="text-3xl font-bold text-white mb-1 tracking-tight">

// NEW
<h2 className="text-3xl font-bold text-primary-foreground mb-1.5 tracking-tight">

// OLD
<p className="text-cyan-100 text-sm font-medium">

// NEW
<p className="text-primary-foreground/90 text-sm font-semibold">
```

#### 4. Quick Stats
```tsx
// OLD
<p className="text-xs text-cyan-100 font-medium">Pickup Date</p>

// NEW
<p className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">Pickup Date</p>
```

#### 5. Content Area
```tsx
// OLD
<div className="flex-1 overflow-y-auto px-6 py-6">

// NEW
<div className="flex-1 overflow-y-auto px-8 py-6 bg-muted">
```

#### 6. Information Cards
```tsx
// OLD
<div className="rounded-xl bg-card border-2 border-cyan-100 p-5 shadow-md hover:shadow-md transition-all duration-300">
  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">

// NEW
<div className="rounded-xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300">
  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
```

#### 7. Section Labels
```tsx
// OLD
<p className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-3">

// NEW
<h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
```

#### 8. Data Backgrounds
```tsx
// OLD
<div className="bg-cyan-50 rounded-lg p-3">

// NEW
<div className="bg-muted rounded-lg px-4 py-3 border border-border">
```

#### 9. Text in Cards
```tsx
// OLD
<span className="text-sm text-gray-700 font-medium">

// NEW
<span className="text-sm text-foreground font-medium">

// OLD
<span className="text-xs text-gray-500">

// NEW
<span className="text-xs text-muted-foreground">
```

#### 10. Footer
```tsx
// OLD
<div className="flex justify-between items-center gap-3 px-6 py-4 border-t bg-gray-50 -mx-6 -mb-6 mt-auto">

// NEW
<div className="flex justify-between items-center gap-3 px-8 py-5 border-t border-border bg-card">
```

#### 11. Button
```tsx
// OLD
className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"

// NEW
className="bg-gradient-to-r from-primary to-cyan-700 hover:from-cyan-600 hover:to-cyan-800 text-primary-foreground"
```

## ✅ Verification Checklist

After implementing, verify:

- [ ] Header uses `from-primary to-cyan-700` gradient
- [ ] Avatar has `bg-card` background with `text-primary` icon
- [ ] All section labels use `text-primary`
- [ ] Cards have `bg-card` and `border-border`
- [ ] Content area has `bg-muted`
- [ ] Data backgrounds use `bg-muted`
- [ ] Body text uses `text-foreground`
- [ ] Muted text uses `text-muted-foreground`
- [ ] Button uses primary gradient
- [ ] No hardcoded hex colors remain

## 🎯 Benefits

1. **Consistency**: All dialogs match your app's design system
2. **Maintainability**: Change theme in one place (globals.css)
3. **Dark Mode**: Automatically supports dark mode when implemented
4. **Brand Alignment**: Uses your cyan-500 primary color throughout
5. **Accessibility**: Proper contrast with foreground/background pairs

## 📝 Notes

- The updated components maintain all functionality
- Only visual styling changes - no logic changes
- Grid pattern background is preserved
- All hover effects and transitions maintained
- Responsive design unchanged

## 🆘 Troubleshooting

**Issue**: Colors don't look right
- **Solution**: Make sure you're using the Tailwind classes, not hardcoded values

**Issue**: Primary color not showing
- **Solution**: Verify `globals.css` has `--primary: 196 81% 55%;`

**Issue**: Dark mode not working
- **Solution**: CSS variables automatically support dark mode when `.dark` class is added

## 📞 Next Steps

1. Review the updated component files
2. Choose implementation method (copy/replace or manual)
3. Test in browser
4. Verify all colors match your design system
5. Check dark mode compatibility (if applicable)

---

**Your Primary Brand Color**: `cyan-500` / `rgb(45, 186, 237)` / `#2DBAED`

Use `bg-primary`, `text-primary`, and `from-primary to-cyan-700` throughout!
