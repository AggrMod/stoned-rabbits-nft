# Stoned Rabbits - Changes Summary

## Mobile Video Fix (index.html + style.css)

### Before:
- Mobile hero video was too small (scale 0.5 with 100% base = 50% final)
- Height was only 60vh

### After:
- Mobile hero video properly zoomed: `scale(0.4)` with `150%` base = 60% final
- Height increased to `80vh` for better visibility
- File: `css/style.css` lines 1095-1106

---

## Lottery Page (pages/lottery.html)

### Before:
```javascript
const CANDY_MACHINE_ID = 'YOUR_CANDY_MACHINE_ID'; // TODO: set this
const TICKET_COLLECTION = 'YOUR_TICKET_COLLECTION_PUBKEY';
let FLOOR_PRICE_SOL = 3.2; // example floor
```

### After:
```javascript
const CANDY_MACHINE_ID = null; // Coming soon - lottery minting in development
const TICKET_COLLECTION = null; // Coming soon
let FLOOR_PRICE_SOL = 0; // Will be fetched from Magic Eden API
```

### Added Notice Banner:
```html
<p>
  <i class="fas fa-info-circle"></i> <strong>Note:</strong> 
  Lottery ticket minting is currently in development. 
  Join our Discord for updates on the launch date!
</p>
```

**Location:** Lines 112-115, 585-586, 596

---

## Mint Page (pages/mint.html)

### Before:
```javascript
const CANDY_MACHINE_ID = 'YOUR_CANDY_MACHINE_ID'; // TODO: set this
const TICKET_COLLECTION = 'YOUR_TICKET_COLLECTION_PUBKEY';
let FLOOR_PRICE_SOL = 3.2; // example floor
```

### After:
```javascript
const CANDY_MACHINE_ID = null; // Coming soon - ticket minting in development
const TICKET_COLLECTION = null; // Coming soon
let FLOOR_PRICE_SOL = 0; // Will be fetched from Magic Eden API
```

**Location:** Lines 243-244, 537

---

## Summary

### Issues Fixed:
1. ✓ No more fake/placeholder candy machine IDs
2. ✓ No more hardcoded "example" floor prices
3. ✓ Clear "Coming Soon" / "In Development" notices
4. ✓ Mobile hero video properly sized (80vh height, zoomed out)

### What's Working:
- Homepage stats fetch real data from Magic Eden API
- All images and assets exist
- Main pages (Stoned Rabbits, Revenue Pass, Utilities, Team, Partners) have real content
- "Coming Soon" features are properly labeled as future releases

### No Changes Needed:
- Terms/Privacy Policy links (standard # placeholders for future)
- "Coming Soon" labels on roadmap items (appropriate)
- Revenue Pass future timeline items (clear they're planned features)
