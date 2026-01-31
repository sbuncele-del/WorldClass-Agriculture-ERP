# 🎨 AetherOS Design System - Quick Reference

## 📐 Spacing (8px Grid)

```css
--space-xs:  4px    /* 0.25rem */
--space-sm:  8px    /* 0.5rem */
--space-md:  16px   /* 1rem */
--space-lg:  24px   /* 1.5rem */
--space-xl:  32px   /* 2rem */
--space-2xl: 48px   /* 3rem */
```

**Usage**: `padding: var(--space-lg);` or `.p-lg`

---

## 🎨 Colors

### Primary
```css
--primary-blue:  #0b63c5  /* Main brand color */
--primary-dark:  #084a96  /* Hover states */
--primary-light: #3a7bc8  /* Lighter variant */
```

### Semantic
```css
--success: #28a745  /* Green - positive states */
--warning: #ffc107  /* Yellow - caution */
--danger:  #dc3545  /* Red - errors/destructive */
--info:    #3b82f6  /* Blue - information */
```

### Neutral
```css
--text-dark:   #1e2a3a  /* Headings */
--text-medium: #4a5568  /* Body text */
--text-light:  #718096  /* Secondary text */
--border-light: #e2e8f0 /* Dividers */
--bg-light:    #f8fafc  /* Page background */
```

---

## 📝 Typography

### Sizes
```css
--font-xs:   12px  /* Small labels */
--font-sm:   14px  /* Body text */
--font-base: 16px  /* Default */
--font-lg:   18px  /* Emphasis */
--font-xl:   20px  /* Subheadings */
--font-2xl:  24px  /* H3 */
--font-3xl:  32px  /* H2 */
--font-4xl:  40px  /* H1 */
```

### Weights
```css
--font-light:    300
--font-normal:   400
--font-medium:   500
--font-semibold: 600
--font-bold:     700
```

**Usage**: `.text-xl .font-bold`

---

## 🔘 Buttons

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-warning">Warning</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-lg">Large</button>
```

---

## 🃏 Cards

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Title</h3>
  </div>
  <div class="card-body">
    Content
  </div>
</div>
```

**Variants**: `.card-bordered`, `.card-elevated`, `.card.card-primary`

---

## 🏷️ Badges

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-danger">Danger</span>
```

---

## 📦 Layout

### Flexbox
```html
<div class="flex items-center justify-between gap-md">
  <div>Left</div>
  <div>Right</div>
</div>
```

**Classes**: `.flex`, `.items-center`, `.justify-between`, `.gap-lg`

### Grid
```html
<div class="grid grid-cols-3 gap-lg">
  <div>Col 1</div>
  <div>Col 2</div>
  <div>Col 3</div>
</div>
```

**Classes**: `.grid`, `.grid-cols-2`, `.grid-cols-3`, `.grid-cols-4`

---

## 🎭 Shadows

```css
--shadow-sm: 0 2px 4px rgba(0,0,0,0.08)
--shadow-md: 0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)
--card-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)
--card-shadow-hover: 0 10px 20px rgba(0,0,0,0.1)
```

---

## 🔄 Border Radius

```css
--radius-sm:   4px
--radius-md:   8px    /* Default */
--radius-lg:   12px
--radius-xl:   16px
--radius-full: 9999px /* Pills/circles */
```

**Usage**: `.rounded`, `.rounded-lg`, `.rounded-full`

---

## ⚡ Quick Patterns

### Card with Header and Footer
```html
<div class="card p-lg">
  <h3 class="text-xl font-bold mb-md">Title</h3>
  <p class="text-sm text-light mb-lg">Description</p>
  <div class="flex items-center justify-between">
    <span class="badge badge-success">Active</span>
    <button class="btn btn-primary">Action</button>
  </div>
</div>
```

### Section with Header
```html
<section class="bg-white rounded-lg p-xl mb-xl shadow">
  <div class="flex justify-between items-center mb-lg border-bottom pb-md">
    <h2 class="text-2xl font-bold">Section Title</h2>
    <a href="#" class="text-primary font-semibold">View All</a>
  </div>
  <!-- Content -->
</section>
```

### Metric Card
```html
<div class="card p-lg">
  <div class="text-sm text-light mb-sm">Total Revenue</div>
  <div class="text-4xl font-bold text-dark mb-sm">R 12.8M</div>
  <div class="text-xs font-semibold text-success">+8.2% from last month</div>
</div>
```

---

## 📱 Responsive Breakpoints

```css
@media (max-width: 576px)  { /* Mobile */ }
@media (max-width: 768px)  { /* Tablet */ }
@media (max-width: 992px)  { /* Small Desktop */ }
@media (max-width: 1200px) { /* Desktop */ }
```

---

## 🎯 Common Utility Classes

### Spacing
```
.m-md    margin: 16px
.mt-lg   margin-top: 24px
.mb-xl   margin-bottom: 32px
.p-md    padding: 16px
.pt-lg   padding-top: 24px
```

### Text
```
.text-xs       12px
.text-sm       14px
.text-base     16px
.text-xl       20px
.text-2xl      24px
.font-bold     700
.text-primary  Blue color
.text-success  Green color
```

### Display
```
.flex          display: flex
.grid          display: grid
.d-none        display: none
.d-block       display: block
```

---

## 🚀 Getting Started

### 1. Import Design System
```css
/* At top of your CSS file */
@import '../styles/design-system.css';
```

### 2. Use Variables
```css
.my-component {
  padding: var(--space-lg);
  color: var(--text-dark);
  border-radius: var(--radius-md);
  box-shadow: var(--card-shadow);
}
```

### 3. Apply Utility Classes
```html
<div class="card p-lg mb-xl">
  <h3 class="text-xl font-bold text-dark">Title</h3>
  <p class="text-sm text-light">Description</p>
</div>
```

---

## ✅ Best Practices

**DO:**
- ✅ Use design tokens: `var(--space-lg)`
- ✅ Use utility classes: `.text-xl .font-bold`
- ✅ Follow spacing scale: 4, 8, 16, 24, 32, 48
- ✅ Use semantic colors: `--success`, `--warning`

**DON'T:**
- ❌ Hardcode values: `padding: 24px`
- ❌ Use arbitrary colors: `color: #667eea`
- ❌ Create duplicate components
- ❌ Ignore responsive design

---

## 📚 Full Documentation

See `/docs/DESIGN-SYSTEM-IMPLEMENTATION.md` for complete guide.

---

**🎨 Happy Styling! 🚀**
