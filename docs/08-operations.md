# Operations Manual

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production Ready

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Monthly Tasks](#monthly-tasks)
3. [Community Management](#community-management)
4. [Content Updates](#content-updates)
5. [Analytics & Reporting](#analytics--reporting)
6. [Support Procedures](#support-procedures)

---

## Daily Operations

### Morning Checklist (9 AM)

```bash
# 1. Check website status
curl -I https://stonedrabbitsnft.com
curl -I https://utility.stonedrabbitsnft.com

# 2. Check RPC endpoint
curl -X POST https://mainnet.helius-rpc.com/?api-key=YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# 3. Check Magic Eden stats
curl https://api-mainnet.magiceden.dev/v2/collections/stonned_rabitts/stats

# 4. Review error logs
tail -f /var/log/application.log | grep ERROR
```

**Action Items:**
- [ ] Verify all systems operational
- [ ] Check Discord for urgent messages
- [ ] Review overnight transactions
- [ ] Check Magic Eden floor price
- [ ] Monitor social media mentions

### Mid-Day Checklist (2 PM)

- [ ] Respond to Discord community questions
- [ ] Check Twitter DMs and mentions
- [ ] Review Utility Factory submissions
- [ ] Update team on any issues
- [ ] Check NFT holder count

### Evening Checklist (6 PM)

- [ ] Final Discord check
- [ ] Schedule next day's social posts
- [ ] Review analytics dashboard
- [ ] Backup important data
- [ ] Document any incidents

---

## Monthly Tasks

### First of Month

**Revenue Distribution (When Smart Contracts Launch)**

```typescript
// 1. Collect revenue data from Gamblor
const revenueData = {
  month: '2026-02',
  sources: [
    { name: 'Stoned Rabbits Classic', revenue: 25000 },
    { name: 'Carrot Frenzy', revenue: 15000 },
    { name: 'Rabbit Hole', revenue: 10000 }
  ],
  totalRevenue: 50000
};

// 2. Calculate distribution
const revenueShare = 0.10; // 10%
const totalPasses = 777;
const distributionAmount = revenueData.totalRevenue * revenueShare;
const perPassAmount = distributionAmount / totalPasses;

console.log(`Distribution: ${distributionAmount} USD`);
console.log(`Per Pass: ${perPassAmount.toFixed(2)} USD`);

// 3. Trigger smart contract distribution
await program.methods
  .triggerDistribution(revenueData.month)
  .accounts({ ... })
  .rpc();

// 4. Send email notifications
await sendDistributionEmails(revenueData.month, perPassAmount);

// 5. Update website with stats
updateRevenuePassPage(revenueData);

// 6. Announce in Discord
postToDiscord(`
  🎰 **Revenue Distribution Available!**

  Month: ${revenueData.month}
  Total Pool: $${distributionAmount.toLocaleString()}
  Per Pass: $${perPassAmount.toFixed(2)}

  Claim now at [link]
`);
```

### Mid-Month

**Lottery Drawing (When Implemented)**

```typescript
// 1. Close ticket sales
await closeLotteryRound('lottery_001');

// 2. Request randomness from Switchboard VRF
const vrfRequest = await requestRandomness();

// 3. Wait for randomness callback
await waitForVRFCallback(vrfRequest);

// 4. Select winner
const winner = await selectWinner('lottery_001');

console.log(`Winner: ${winner.walletAddress}`);
console.log(`Winning Ticket: ${winner.ticketNumber}`);

// 5. Transfer prize
await transferPrize(winner.walletAddress, prizePool);

// 6. Announce winner
await announceWinner(winner);

// 7. Start new lottery round
await createNewLotteryRound({
  prizePool: 100,
  startDate: new Date(),
  endDate: addMonths(new Date(), 1)
});
```

### End of Month

**Analytics Report**

```typescript
// Generate monthly report
const report = {
  month: '2025-11',
  metrics: {
    websiteVisits: await getWebsiteVisits(),
    uniqueVisitors: await getUniqueVisitors(),
    nftHolders: await getNFTHolderCount(),
    floorPrice: await getFloorPrice('stonned_rabitts'),
    volume: await getMonthlyVolume(),
    lotteryTicketsSold: await getLotteryTicketCount(),
    utilityFactorySubmissions: await getProjectCount(),
    discordMembers: await getDiscordMemberCount(),
    twitterFollowers: await getTwitterFollowers()
  }
};

// Create report document
await generateReport(report);

// Share with team
await sendTeamEmail('Monthly Report', reportHTML);

// Post highlights to Discord
await postMonthlyHighlights(report);
```

---

## Community Management

### Discord Moderation

**Daily Tasks:**
- Monitor #general for spam
- Answer questions in #support
- Engage with community in #chat
- Post updates in #announcements

**Response Templates:**

```
Q: "When is the next revenue distribution?"
A: Revenue distributions occur on the 1st of each month starting Q1 2026 when slot machines launch. Pass holders will be notified via email and Discord.

Q: "How do I claim my revenue share?"
A: Once smart contracts are live, you'll be able to claim directly on the website by connecting your wallet. Detailed instructions will be provided before launch.

Q: "Where can I buy Stoned Rabbits?"
A: You can buy on Magic Eden: https://magiceden.io/marketplace/stonned_rabitts

Q: "What utilities are planned?"
A: We're building: 1) Revenue sharing from slots, 2) Lottery system, 3) Staking platform, 4) Exclusive alpha access. Full roadmap on our website.

Q: "Can I use NFT Utility Factory for my project?"
A: Yes! Visit https://utility.stonedrabbitsnft.com to see our services and submit a project request.
```

### Social Media Schedule

**Twitter:**
- **Monday:** Week preview / Community spotlight
- **Wednesday:** Project update / Behind the scenes
- **Friday:** Weekend vibes / Meme contest
- **Daily:** Engage with mentions and comments

**Content Ideas:**
- Holder spotlights
- Slot machine development updates
- Revenue Pass benefits reminders
- Community art showcases
- Partnership announcements
- AMA sessions
- Giveaways

### Community Events

**Monthly AMA:**
```
📅 Date: First Friday of each month
⏰ Time: 7 PM EST
📍 Where: Discord Voice Channel

Topics:
- Project updates
- Roadmap progress
- Q&A with team
- Community feedback

Preparation:
1. Create announcement 1 week prior
2. Collect questions in #ama-questions
3. Prepare answers for common questions
4. Record session for those who can't attend
5. Post summary in #announcements after
```

**Giveaway Example:**
```
🎉 STONED RABBITS GIVEAWAY 🎉

Prize: 1 Stoned Rabbit NFT

How to Enter:
1. Follow @StonedRabbitts
2. Like & RT this tweet
3. Tag 3 friends
4. Join our Discord: [link]

Winner announced in 48 hours!

#SolanaNFT #NFTGiveaway
```

---

## Content Updates

### Updating Website Content

**Floor Price Update:**
```javascript
// Stoned Rabbits/index.html
// Update the floor price stat
document.querySelector('.floor-price').textContent = '3.2 SOL';
```

**Adding New Team Member:**
```html
<!-- Stoned Rabbits/index.html -->
<div class="team-member" data-aos="fade-up">
  <img src="images/team/new-member.jpg" alt="New Member">
  <h3>Name</h3>
  <p class="role">Role</p>
  <div class="social-links">
    <a href="https://twitter.com/username"><i class="fab fa-twitter"></i></a>
  </div>
</div>
```

**Adding Partner:**
```html
<!-- Stoned Rabbits/index.html -->
<div class="partner-card" data-aos="zoom-in">
  <img src="images/partners/logo.png" alt="Partner Name">
  <h4>Partner Name</h4>
  <p>Partnership description</p>
  <a href="https://partner.com" target="_blank">Visit Site</a>
</div>
```

### Utility Factory Updates

**Adding New Service:**
```html
<!-- NFT Utility Factory/index.html -->
<div class="glass rounded-2xl p-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-2xl font-bold">New Service Name</h3>
    <span class="text-accent font-bold">From $XXX</span>
  </div>
  <p class="mb-4">Service description...</p>
  <ul class="space-y-2 mb-6">
    <li>✓ Feature 1</li>
    <li>✓ Feature 2</li>
    <li>✓ Feature 3</li>
  </ul>
  <a href="#contact" class="btn btn-primary">Get Quote</a>
</div>
```

**Updating Pricing:**
```html
<!-- Update package prices -->
<div class="text-5xl font-bold text-accent mb-2">$NEW_PRICE</div>
```

---

## Analytics & Reporting

### Key Metrics to Track

**Website Analytics (Google Analytics):**
- Daily/Monthly visitors
- Bounce rate
- Average session duration
- Traffic sources
- Popular pages
- Conversion rate (wallet connections)

**NFT Metrics:**
```javascript
// Fetch from Magic Eden API
async function getCollectionMetrics() {
  const response = await fetch(
    'https://api-mainnet.magiceden.dev/v2/collections/stonned_rabitts/stats'
  );
  const data = await response.json();

  return {
    floorPrice: data.floorPrice / 1e9,
    listedCount: data.listedCount,
    volumeAll: data.volumeAll / 1e9,
    holders: await getHolderCount() // Custom function
  };
}
```

**Social Metrics:**
- Twitter followers growth
- Discord member count
- Engagement rate (likes, comments, shares)
- Mention sentiment

### Weekly Report Template

```markdown
# Weekly Report - Week of [Date]

## Highlights
- 🎯 [Major achievement]
- 📈 [Growth metric]
- 🚀 [Launch or announcement]

## Metrics
- Website Visits: [number] ([+/- %] vs last week)
- Discord Members: [number] ([+/- %] vs last week)
- Twitter Followers: [number] ([+/- %] vs last week)
- Floor Price: [number] SOL ([+/- %] vs last week)
- Volume: [number] SOL ([+/- %] vs last week)

## Completed Tasks
- [x] Task 1
- [x] Task 2
- [x] Task 3

## Next Week's Goals
- [ ] Goal 1
- [ ] Goal 2
- [ ] Goal 3

## Blockers/Issues
- [Issue if any]

## Community Feedback
- [Notable feedback or requests]
```

---

## Support Procedures

### Ticket Classification

**Priority 1 (Critical) - Response within 1 hour:**
- Website down
- Smart contract exploit
- Treasury wallet compromised
- Data breach

**Priority 2 (High) - Response within 4 hours:**
- Payment processing issues
- NFT transfer problems
- Revenue distribution errors
- Wallet connection failures

**Priority 3 (Medium) - Response within 24 hours:**
- General questions
- Feature requests
- Content updates
- Partnership inquiries

**Priority 4 (Low) - Response within 48 hours:**
- Documentation improvements
- UI/UX feedback
- Marketing suggestions

### Common Support Scenarios

**Scenario 1: "I can't connect my wallet"**

```
Response:
1. Which wallet are you using? (Phantom/Solflare/Backpack)
2. Have you installed the browser extension?
3. Try refreshing the page
4. Try disconnecting and reconnecting
5. Check if wallet is unlocked
6. Try a different browser

If still not working, ask for:
- Browser and version
- Wallet extension version
- Console errors (F12 > Console tab)
```

**Scenario 2: "My NFT transfer failed"**

```
Response:
1. Get transaction signature
2. Check on Solana Explorer: https://solscan.io/tx/[signature]
3. Common issues:
   - Insufficient SOL for fees
   - Invalid recipient address
   - Network congestion
4. If transaction succeeded on-chain, refresh NFT list
5. If failed, suggest retry with more SOL for fees
```

**Scenario 3: "When can I claim my revenue share?"**

```
Response:
Revenue distributions start Q1 2026 when the slot machines launch.

Timeline:
- Q1 2026: 5+ slot machines go live on Gamblor.io
- Each month: Revenue collected and distributed
- 1st of month: Distribution available to claim
- You'll receive email + Discord notification

How it works:
1. Gamblor sends us monthly revenue report
2. We calculate 10% share divided by 777 passes
3. Smart contract makes funds claimable
4. Pass holders connect wallet and claim

Current status: Smart contracts in development
```

### Escalation Path

```
User Report
    ↓
Community Manager (Discord/Twitter)
    ↓
[If technical] → Developer
[If business] → Project Lead
[If security] → Security Team + All Hands

Security incidents:
    ↓
IMMEDIATE: Pause affected systems
    ↓
Notify: All team members
    ↓
Investigate: Technical team
    ↓
Fix: Developer(s)
    ↓
Post-mortem: Full team
```

---

**Last Updated:** November 2025
**Status:** ✅ Production Ready
