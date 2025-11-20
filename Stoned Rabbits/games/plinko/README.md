# Stoned Rabbits Plinko Game

A fully functional Plinko game built with Phaser.js and integrated with Solana blockchain for the Stoned Rabbits NFT project.

## Features

### ✅ Core Game Mechanics
- **Physics-based Plinko board** with 12 rows of pegs
- **11 multiplier zones** ranging from 0.2x to 10x
- **Matter.js physics** for realistic ball bouncing
- **Smooth animations** and visual effects
- **Responsive design** that works on desktop and mobile

### ✅ Solana Integration
- **Phantom wallet connection**
- **NFT loading** from user's wallet
- **NFT as ball texture** - use your Stoned Rabbit as the game ball
- **Demo balance system** (10 SOL starting balance)
- **Auto-reconnect** if wallet was previously connected

### ✅ Game Features
- **Adjustable bet amounts** (0.05 - 10 SOL)
- **Quick bet buttons** for common amounts (0.1, 0.5, 1.0 SOL)
- **Real-time balance tracking**
- **Total winnings display**
- **Win animations and messages**
- **Multiplier zone flash effects**
- **Prevents dropping during active drop**
- **Insufficient balance detection**

### ✅ User Interface
- **Clean, modern UI** matching Stoned Rabbits branding
- **Left sidebar** with balance, bet controls, and stats
- **Visual multiplier zones** with color coding
- **Dynamic prize amounts** based on current bet
- **Wallet status display**
- **Responsive button states**

## File Structure

```
games/plinko/
├── README.md           # This file
├── PlinkoScene.js      # Main game logic and physics
├── main.js             # Wallet integration and initialization
└── assets/
    ├── sprites/        # Game sprites (generated programmatically)
    └── sounds/         # Sound effects (optional)
```

## How It Works

### Game Flow

1. **Player connects wallet** via Phantom
2. **System loads NFTs** from player's wallet
3. **Player sets bet amount** using controls
4. **Player clicks top of board** to drop ball
5. **Ball bounces through pegs** using Matter.js physics
6. **Ball lands in multiplier zone**
7. **Winnings calculated** and added to balance
8. **Win message displayed** with animation

### Physics Configuration

- **Gravity**: 1.2 (vertical)
- **Ball Restitution**: 0.7 (bounciness)
- **Ball Friction**: 0.001 (very low for smooth rolling)
- **Ball Air Friction**: 0.01 (slight air resistance)
- **Peg Restitution**: 0.8 (pegs are bouncy)
- **Peg Friction**: 0.01 (very low)

### Multiplier Distribution

From left to right:
```
0.2x | 0.5x | 1x | 2x | 5x | 10x | 5x | 2x | 1x | 0.5x | 0.2x
```

Center zones have higher multipliers, creating risk/reward gameplay.

## Technical Details

### Dependencies

- **Phaser.js 3.80.1** - Game framework
- **Solana Web3.js** - Blockchain integration
- **Matter.js** - Physics engine (included with Phaser)

### Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers
- ⚠️ Requires WebGL support

### Performance

- **60 FPS** on most devices
- **Optimized physics** for smooth gameplay
- **Minimal memory usage** (~50-100MB)
- **No external assets required** (graphics generated programmatically)

## Integration with Website

### Adding to Navigation

The game is accessible at `/pages/plinko.html`. Add to your navigation:

```html
<li class="nav-item">
  <a href="./pages/plinko.html" class="nav-link">Plinko</a>
</li>
```

### Embedding in Existing Page

You can also embed the game in any page:

```html
<!-- Add Phaser and Solana dependencies -->
<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
<script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>

<!-- Add game files -->
<script src="./games/plinko/PlinkoScene.js"></script>
<script src="./games/plinko/main.js"></script>

<!-- Create container -->
<div id="plinko-game-container"></div>

<!-- Initialize -->
<script>
  initPlinkoGame();
</script>
```

## Customization

### Changing Colors

Edit `PlinkoScene.js`:

```javascript
// Background color
this.add.rectangle(400, 400, 800, 800, 0x0a0a0a); // Change 0x0a0a0a

// Board background
boardBg.fillStyle(0x1a1a2e, 1); // Change 0x1a1a2e

// Peg color
pegSprite.setTint(0x4ecdc4); // Change 0x4ecdc4
```

### Changing Multipliers

Edit `PlinkoScene.js` constructor:

```javascript
this.multipliers = [0.2, 0.5, 1, 2, 5, 10, 5, 2, 1, 0.5, 0.2];
// Change array to your preferred multipliers
```

### Changing Board Size

Edit `PlinkoScene.js` constructor:

```javascript
this.pegRows = 12; // Number of peg rows (affects drop time)
this.pegSpacing = 45; // Distance between pegs (affects spread)
```

### Changing Physics

Edit `main.js` Phaser config:

```javascript
matter: {
  gravity: { y: 1.2 }, // Increase for faster drops
  debug: true // Enable to see collision shapes
}
```

### Adding Sound Effects

1. Add sound files to `assets/sounds/`
2. Load in `preload()`:
   ```javascript
   this.load.audio('drop', 'assets/sounds/drop.mp3');
   this.load.audio('win', 'assets/sounds/win.mp3');
   ```
3. Play in game:
   ```javascript
   this.sound.play('drop');
   ```

## Real Blockchain Integration

Currently uses **demo balance** for testing. To integrate with real Solana:

### Step 1: Create Game Wallet

```javascript
// In main.js, add:
const GAME_WALLET = new PublicKey('YOUR_GAME_WALLET_ADDRESS');
```

### Step 2: Handle Real Bets

```javascript
async function placeBet(amount) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(walletPublicKey),
      toPubkey: GAME_WALLET,
      lamports: amount * 1e9 // Convert SOL to lamports
    })
  );

  const signature = await window.solana.signAndSendTransaction(transaction);
  await connection.confirmTransaction(signature);
}
```

### Step 3: Handle Payouts

```javascript
async function payoutWinnings(amount) {
  // This would be handled by your backend/smart contract
  // Send SOL from game wallet to player wallet
}
```

### Step 4: Smart Contract (Recommended)

For production, use an Anchor program:
- Escrow bets in program
- Use Solana's on-chain randomness (VRF)
- Automatic payouts based on result
- Provably fair gameplay

## Security Considerations

### Current Implementation (Demo)
- ✅ Client-side balance (for testing only)
- ✅ No real money at risk
- ✅ Perfect for development/testing

### Production Requirements
- ⚠️ **Move game logic to backend** or smart contract
- ⚠️ **Use on-chain randomness** (Switchboard VRF or similar)
- ⚠️ **Implement proper bet escrow**
- ⚠️ **Add rate limiting** to prevent abuse
- ⚠️ **Add transaction signing** for all bets
- ⚠️ **Audit smart contracts** before mainnet deployment
- ⚠️ **Comply with gambling regulations** in your jurisdiction

## Testing

### Local Testing

1. Open `pages/plinko.html` in browser
2. Click "Connect Phantom"
3. Approve wallet connection
4. Click "START PLAYING"
5. Click top of board to drop balls

### Debug Mode

Enable physics debugging in `main.js`:

```javascript
matter: {
  gravity: { y: 1.2 },
  debug: true // Shows collision boxes and bodies
}
```

### Console Logging

Check browser console for:
- Wallet connection status
- NFT loading progress
- Game events
- Error messages

## Performance Optimization

### Current Optimizations
- Graphics generated programmatically (no image loading)
- Efficient sprite batching
- Auto-cleanup of dropped balls
- Optimized collision detection

### Further Optimizations
- Add object pooling for balls
- Reduce peg count on mobile
- Disable shadows on low-end devices
- Use sprite sheets for animated effects

## Roadmap

### Phase 1: Current ✅
- [x] Core Plinko mechanics
- [x] Wallet integration
- [x] NFT loading
- [x] UI/UX
- [x] Demo balance system

### Phase 2: Gamblor Integration 🚧
- [ ] Backend integration
- [ ] Real SOL betting
- [ ] Database for game history
- [ ] Leaderboards
- [ ] Statistics tracking

### Phase 3: Enhanced Features 📋
- [ ] Sound effects and music
- [ ] Multiple game modes
- [ ] Tournament mode
- [ ] Social features (share wins)
- [ ] NFT traits affect gameplay
- [ ] Special events and bonuses

### Phase 4: Mobile App 💡
- [ ] React Native wrapper
- [ ] Push notifications
- [ ] Offline mode (demo)
- [ ] Mobile-optimized UI

## Support

### Common Issues

**Q: Game won't load**
- Check console for errors
- Ensure Phaser.js CDN is accessible
- Verify all game files are in correct locations

**Q: Wallet won't connect**
- Install Phantom wallet extension
- Check if wallet is unlocked
- Try refreshing the page

**Q: NFTs not loading**
- Check wallet has NFTs
- Verify RPC endpoint is working
- Demo NFT will be used as fallback

**Q: Ball gets stuck**
- Auto-cleanup after 8 seconds
- Refresh page to reset
- Report if consistently stuck

### Contact

- **Project:** Stoned Rabbits NFT
- **Developer:** Built with Phaser.js + Solana
- **Support:** Discord: https://discord.gg/px9kyxbBhc

## License

Part of the Stoned Rabbits NFT project. All rights reserved.

---

**Enjoy playing Stoned Rabbits Plinko! 🐰🎰**
