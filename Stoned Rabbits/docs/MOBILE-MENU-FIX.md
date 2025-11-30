# Mobile Menu Fix Documentation

## Problem
The mobile hamburger menu was being covered by page content on all pages. Despite having `z-index: 99999`, the menu remained hidden behind hero sections and other content.

## Root Cause
**CSS Stacking Context Issue**: The `.nav-menu` was inside the `<header>` element which created its own stacking context. When a parent element establishes a stacking context, child elements cannot escape it with z-index alone - they're confined to layer within their parent's context.

The header had:
```css
header {
  position: fixed;
  z-index: 99998;
}
```

The nav-menu had:
```css
.nav-menu {
  position: fixed;
  z-index: 99999;
}
```

Even though 99999 > 99998, the nav-menu was still a child of header in the DOM, so it couldn't layer above elements outside the header's stacking context.

## Solution
Move the nav-menu element out of the header and directly onto the body on mobile devices.

### Code (js/main.js, lines 12-15)
```javascript
// MOBILE FIX: Move nav-menu to body root to break stacking context
if (window.innerWidth <= 768 && navMenu) {
  document.body.appendChild(navMenu);
}
```

## Why This Works
1. Moving nav-menu to `<body>` removes it from header's stacking context
2. As a direct child of body, it can now properly layer above all other content
3. The `position: fixed` styling still works because fixed positioning is relative to the viewport, not the parent element
4. The existing CSS selectors (`.nav-menu`, `.nav-menu.active`) continue to work

## Files Modified
- `js/main.js` - Added DOM manipulation to move nav-menu on mobile

## CSS Dependencies
The fix relies on these existing styles in `css/style.css`:
- `.nav-menu` at line 1060-1073 (mobile styles)
- `.nav-menu.active` at line 1075-1077
- `.mobile-toggle` at line 1083-1086

## Testing
Test on mobile devices or using browser DevTools with mobile viewport (375px width):
1. Navigate to any page
2. Tap the hamburger menu icon
3. Menu should slide in from the right and be fully visible above all content

## Alternative Approaches Tried (Did Not Work)
1. Increasing z-index values (up to 99999)
2. Adding `!important` to z-index declarations
3. Setting content sections to `z-index: 0`
4. Using `transform: translateX()` instead of `right: -100%`
5. Adding backdrop overlays

Only the JavaScript DOM manipulation approach successfully resolved the stacking context issue.
