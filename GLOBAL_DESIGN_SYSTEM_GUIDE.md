# Dialog Redesign Using Global Design System

## Your Current Design System

### CSS Variables (from globals.css)
```css
--primary: 196 81% 55%;  /* Cyan-500: rgb(45, 186, 237) / #2DBAED */
--primary-foreground: 0 0% 100%;  /* White */
--secondary: 196 33% 17%;  /* Dark cyan */
--muted: 210 40% 96%;  /* Light gray */
--muted-foreground: 215.4 16.3% 46.9%;  /* Gray text */
--accent: 196 81% 55%;  /* Same as primary */
--card: 0 0% 100%;  /* White */
--border: 214.3 31.8% 91.4%;  /* Light gray border */
```

### Tailwind Colors (from tailwind.config.ts)
```typescript
cyan: {
  500: "rgb(45, 186, 237)",  // Your primary brand color
  600: "#00acc1",
  700: "#0097a7",
}
```

## Updated Dialog Design Using Global Colors

### Color Mapping

| Element | Use Global Token | Tailwind Class |
|---------|------------------|----------------|
| Header Gradient | primary + darker shade | `bg-gradient-to-r from-primary to-cyan-700` |
| Avatar Background | card (white) | `bg-card` |
| Avatar Icon | primary | `text-primary` |
| Section Labels | primary | `text-primary` |
| Icon Backgrounds | primary, purple, green, amber | `bg-primary`, `bg-purple-600`, `bg-green-600`, `bg-amber-600` |
| Card Backgrounds | card | `bg-card` |
| Card Borders | border | `border-border` |
| Content Area | muted | `bg-muted` |
| Data Backgrounds | muted | `bg-muted` |
| Body Text | foreground | `text-foreground` |
| Muted Text | muted-foreground | `text-muted-foreground` |
| Button | primary gradient | `bg-gradient-to-r from-primary to-cyan-700` |

### Implementation

#### 1. Header Section
```tsx
<div className="relative bg-gradient-to-r from-primary to-cyan-700 px-8 py-10">
  {/* Grid pattern background */}
  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,...')] opacity-20"></div>
  
  <div className="relative z-10">
    {/* Avatar */}
    <div className="w-20 h-20 rounded-2xl bg-card backdrop-blur-sm flex items-center justify-center shadow-xl">
      <Users className="h-10 w-10 text-primary" />
    </div>
    
    {/* Title */}
    <h2 className="text-3xl font-bold text-primary-foreground mb-1.5 tracking-tight">
      {name}
    </h2>
    
    {/* Subtitle */}
    <p className="text-primary-foreground/90 text-sm font-semibold">
      {subtitle}
    </p>
  </div>
</div>
```

#### 2. Quick Stats Cards
```tsx
<div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
      <Phone className="h-5 w-5 text-primary-foreground" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">Phone</p>
      <p className="text-sm font-bold text-primary-foreground truncate">{phone}</p>
    </div>
  </div>
</div>
```

#### 3. Content Area
```tsx
<div className="flex-1 overflow-y-auto px-8 py-6 bg-muted">
  {/* Information cards */}
</div>
```

#### 4. Information Cards
```tsx
<div className="rounded-xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300">
  <div className="flex items-start gap-4">
    {/* Icon */}
    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
      <User className="h-6 w-6 text-primary-foreground" />
    </div>
    
    {/* Content */}
    <div className="flex-1">
      <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
        Contact Information
      </h3>
      <div className="space-y-2.5">
        <div className="flex items-center gap-2.5">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground font-medium">{phone}</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 5. Data Backgrounds
```tsx
<div className="bg-muted rounded-lg px-4 py-3 border border-border">
  <span className="text-sm font-bold text-foreground">
    {data}
  </span>
</div>
```

#### 6. Footer
```tsx
<div className="flex justify-between items-center gap-3 px-8 py-5 border-t border-border bg-card">
  <p className="text-xs text-muted-foreground font-medium">
    Employee profile information
  </p>
  <Button className="bg-gradient-to-r from-primary to-cyan-700 hover:from-cyan-600 hover:to-cyan-800 text-primary-foreground font-semibold px-8 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
    Close
  </Button>
</div>
```

## Complete Class Replacements

### Replace These Hardcoded Colors:

```tsx
// OLD: Hardcoded colors
from-[#0EA5E9] to-[#3B82F6]
bg-[#0EA5E9]
text-[#0EA5E9]
bg-[#8B5CF6]
bg-[#10B981]
bg-[#F59E0B]
bg-[#F3F4F6]
border-gray-200
text-gray-500
text-gray-700
text-gray-900

// NEW: Global design tokens
from-primary to-cyan-700
bg-primary
text-primary
bg-purple-600
bg-green-600
bg-amber-600
bg-muted
border-border
text-muted-foreground
text-foreground
text-card-foreground
```

## Benefits of Using Global Design System

1. **Consistency**: All components use the same color palette
2. **Maintainability**: Change colors in one place (globals.css)
3. **Dark Mode Ready**: CSS variables support dark mode automatically
4. **Brand Alignment**: Uses your primary cyan color throughout
5. **Accessibility**: Proper contrast ratios with foreground/background pairs
6. **Flexibility**: Easy to update entire app's theme

## Implementation Checklist

- [ ] Replace header gradient with `from-primary to-cyan-700`
- [ ] Change avatar background to `bg-card`
- [ ] Update avatar icon to `text-primary`
- [ ] Replace all hardcoded icon backgrounds with semantic colors
- [ ] Change card borders to `border-border`
- [ ] Update data backgrounds to `bg-muted`
- [ ] Replace text colors with `text-foreground`, `text-muted-foreground`
- [ ] Update button gradient to use primary colors
- [ ] Change content area to `bg-muted`
- [ ] Update footer to `bg-card` with `border-border`
