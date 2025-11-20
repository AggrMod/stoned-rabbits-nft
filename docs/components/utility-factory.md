# NFT Utility Factory Component

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production Ready

---

## Overview

The NFT Utility Factory is a B2B platform offering utility development services to other NFT projects.

**File Location:** `/NFT Utility Factory/index.html` (~800 lines)

---

## Service Catalog

### 1. Staking Platform ($500+)
- Custom staking pools with flexible lock periods
- Automated reward distribution (SOL/SPL tokens)
- Real-time analytics & holder dashboard
- Withdraw/emergency unstake features

### 2. Airdrop Manager ($300+)
- Snapshot tools (by trait/rarity/holder duration)
- Automated token distribution
- Claim page generation with expiry
- CSV export for manual distributions

### 3. Lottery/Raffle System ($600+)
- Multiple entry methods (purchase/burn/hold)
- Provably fair drawing (Switchboard VRF)
- Winner announcement automation
- Prize pool management

### 4. Custom Website ($800+)
- Responsive design (mobile + desktop)
- Wallet integration (Phantom/Solflare/Backpack)
- NFT display galleries with filters
- Magic Eden integration for stats

### 5. Discord Bot ($400+)
- Holder verification & role management
- Floor price alerts & volume stats
- Airdrop announcements
- Custom commands for project

### 6. Minting Site ($700+)
- Candy Machine v3 integration
- Whitelist management (Merkle tree)
- Payment processing (SOL/USDC/credit card)
- Minting progress tracking

### 7. Token Management ($500+)
- SPL token creation & deployment
- Distribution tools & vesting schedules
- Burn mechanics & token gates
- LP management tools

---

## Pricing Packages

### Starter - $500
**Ideal for: New projects with limited budget**

Includes:
- 1 basic utility (staking or airdrop)
- Standard UI with client branding
- 30 days support
- Documentation & tutorials
- Deployment assistance

Deliverables:
- Working utility (hosted or self-hosted)
- Setup guide
- Basic admin panel

Timeline: 2-3 weeks

### Professional - $2,000 (Most Popular)
**Ideal for: Established projects wanting custom solutions**

Includes:
- Up to 3 utilities of choice
- Custom UI design & full branding
- 90 days support + monthly updates
- Priority development queue
- Analytics integration (Google Analytics)
- SEO optimization

Deliverables:
- 3 fully integrated utilities
- Admin dashboard
- Comprehensive documentation
- Video tutorials

Timeline: 4-6 weeks

### Enterprise - Custom Quote
**Ideal for: Large projects with complex requirements**

Includes:
- Unlimited utilities
- Fully custom solutions tailored to project
- 1 year support + maintenance
- Dedicated developer assigned
- White-label options available
- API integration for existing tools
- Custom smart contracts

Deliverables:
- Complete ecosystem
- Advanced admin tools
- 24/7 support channel
- Monthly strategy calls

Timeline: 8-12 weeks

---

## Payment Options

### SOL (5% instant discount)
```
Example: $2,000 package
Discount: $100
Pay: $1,900 worth of SOL
```

### USDC (standard pricing)
```
Example: $2,000 package
Pay: 2,000 USDC
```

### Revenue Share (for established projects)
```
Requirements:
- 500+ holders
- Active trading volume
- Strong community

Terms:
- Reduced upfront cost
- 5-10% revenue share for 12 months
- Applied to utility-generated revenue only
```

### Monthly Installments (Professional+ only)
```
Example: $2,000 package
Downpayment: $500
4 monthly payments: $375 each
Total: $2,000 (no interest)

Requirements:
- 50+ holder verification
- Active Discord/Twitter
```

---

## Project Onboarding

### Submission Form

```html
<form id="project-form">
  <!-- Project Details -->
  <input name="projectName" required placeholder="Project Name">
  <input name="email" type="email" required placeholder="Email">

  <!-- Package Selection -->
  <select name="package" required>
    <option value="">Select Package</option>
    <option value="starter">Starter - $500</option>
    <option value="professional">Professional - $2,000 (Popular)</option>
    <option value="enterprise">Enterprise - Custom Quote</option>
  </select>

  <!-- Service Selection (checkboxes) -->
  <label>
    <input type="checkbox" name="services" value="staking">
    Staking Platform
  </label>
  <label>
    <input type="checkbox" name="services" value="airdrop">
    Airdrop Manager
  </label>
  <!-- ... more services ... -->

  <!-- Project Requirements -->
  <textarea name="details" required placeholder="Describe your project and requirements"></textarea>

  <input name="timeline" placeholder="Desired launch date (optional)">
  <input name="budget" type="number" placeholder="Budget (if custom)">

  <!-- Payment Method -->
  <select name="paymentMethod" required>
    <option value="sol">SOL (5% discount)</option>
    <option value="usdc">USDC</option>
    <option value="revenue-share">Revenue Share</option>
    <option value="monthly">Monthly Installments</option>
  </select>

  <button type="submit">Submit Project Request</button>
</form>
```

### Form Handler

```javascript
document.getElementById('project-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Collect form data
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  // Get selected services
  const services = Array.from(
    document.querySelectorAll('input[name="services"]:checked')
  ).map(cb => cb.value);

  data.services = services;

  // Validate
  if (services.length === 0) {
    alert('Please select at least one service');
    return;
  }

  // Show loading
  showLoading('Submitting your project...');

  try {
    // Send to backend
    const response = await fetch('/api/v1/utility-factory/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      showSuccess(
        `Project submitted successfully!\n\n` +
        `Project ID: ${result.projectId}\n` +
        `We'll review within 24 hours and send you a custom quote.`
      );

      // Reset form
      e.target.reset();
    } else {
      throw new Error(result.error || 'Submission failed');
    }
  } catch (error) {
    showError('Failed to submit project. Please try again or contact us on Discord.');
    console.error(error);
  } finally {
    hideLoading();
  }
});
```

---

## Backend Processing

### Project Submission Handler

```typescript
// POST /api/v1/utility-factory/project
export async function handleProjectSubmission(req, res) {
  const {
    projectName,
    email,
    package: packageType,
    services,
    details,
    timeline,
    budget,
    paymentMethod
  } = req.body;

  // Validate
  if (!projectName || !email || !packageType || services.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Generate project ID
  const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Insert into database
  await db.query(`
    INSERT INTO utility_projects
    (id, project_name, email, package, services, details, timeline, budget, payment_method, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending_review')
  `, [projectId, projectName, email, packageType, JSON.stringify(services), details, timeline, budget, paymentMethod]);

  // Send confirmation email
  await sendEmail(email, 'Project Submission Received', `
    <h1>Thank you for your submission!</h1>
    <p>Your project "${projectName}" has been received.</p>
    <p><strong>Project ID:</strong> ${projectId}</p>
    <p>We'll review your requirements and get back to you within 24 hours with a custom quote.</p>
    <p>Have questions? Reach out on Discord: https://discord.gg/px9kyxbBhc</p>
  `);

  // Notify team
  await sendTeamNotification({
    type: 'new_project',
    projectId,
    projectName,
    package: packageType,
    services,
    email
  });

  return res.json({
    success: true,
    projectId,
    status: 'pending_review',
    estimatedReviewTime: '24 hours'
  });
}
```

### Project Status Tracking

```typescript
// GET /api/v1/utility-factory/project/:projectId
export async function getProjectStatus(req, res) {
  const { projectId } = req.params;

  const project = await db.query(
    'SELECT * FROM utility_projects WHERE id = $1',
    [projectId]
  );

  if (!project.rows.length) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Get updates
  const updates = await db.query(
    'SELECT * FROM project_updates WHERE project_id = $1 ORDER BY created_at DESC',
    [projectId]
  );

  return res.json({
    projectId: project.rows[0].id,
    projectName: project.rows[0].project_name,
    status: project.rows[0].status,
    package: project.rows[0].package,
    services: JSON.parse(project.rows[0].services),
    estimatedCompletion: project.rows[0].estimated_completion,
    progress: calculateProgress(project.rows[0]),
    updates: updates.rows
  });
}

function calculateProgress(project): number {
  const statusProgress = {
    'pending_review': 0,
    'quote_sent': 10,
    'payment_received': 20,
    'in_development': 50,
    'testing': 80,
    'completed': 100
  };

  return statusProgress[project.status] || 0;
}
```

---

## Admin Dashboard

### Project Management Interface

```typescript
// Admin view of all projects
interface AdminDashboard {
  projects: {
    pending: Project[];
    inProgress: Project[];
    completed: Project[];
  };
  metrics: {
    totalProjects: number;
    totalRevenue: number;
    avgCompletionTime: number;
    clientSatisfaction: number;
  };
}

// Update project status
async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
  message: string,
  progress?: number
) {
  await db.query(
    'UPDATE utility_projects SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, projectId]
  );

  await db.query(
    'INSERT INTO project_updates (project_id, message, progress, created_by) VALUES ($1, $2, $3, $4)',
    [projectId, message, progress, 'admin']
  );

  // Send email to client
  const project = await getProject(projectId);
  await sendEmail(project.email, `Project Update: ${project.project_name}`, message);
}
```

---

## Marketing & Promotion

### Value Propositions

**For Projects:**
- Save time & money (vs hiring full-time devs)
- Proven utility solutions (battle-tested code)
- Fast turnaround (2-6 weeks vs 3+ months)
- Ongoing support & updates
- Built by NFT builders, for NFT builders

**For Holders:**
- More utility = higher value
- Professional solutions
- Reliable & secure
- Consistent updates

### Case Studies

```markdown
## Case Study: Cool NFT Project

**Challenge:** Needed staking platform for 5,000 NFT collection

**Solution:**
- Professional package ($2,000)
- Custom staking UI with project branding
- Flexible lock periods (30/60/90 days)
- APY: 15-50% based on lock time

**Results:**
- Launched in 4 weeks
- 60% of holders staking within 1 month
- Floor price +40% after launch
- Active daily users +200%

**Testimonial:**
"The Stoned Rabbits team delivered an amazing staking platform that our community loves. Setup was painless and support was fantastic!" - Cool NFT Founder
```

---

## Technical Details

### Tech Stack for Deliverables

**Frontend:**
- React + TypeScript (for complex UIs)
- Next.js (for SEO-optimized sites)
- Tailwind CSS (styling)
- @solana/wallet-adapter-react

**Backend:**
- Node.js + Express
- PostgreSQL (data storage)
- Redis (caching)

**Smart Contracts:**
- Anchor framework
- Rust
- Audited code (for staking/token contracts)

**DevOps:**
- Vercel (frontend hosting)
- Railway/AWS (backend)
- GitHub Actions (CI/CD)

---

## Quality Assurance

### Delivery Checklist

- [ ] Code review completed
- [ ] Security audit (for contracts)
- [ ] Testing on devnet
- [ ] Documentation written
- [ ] Video tutorial recorded
- [ ] Client training session
- [ ] Monitoring setup
- [ ] Backup procedures in place

### Support SLA

**Starter Package:**
- 30 days support
- Email support (24-48h response)
- Bug fixes included

**Professional Package:**
- 90 days support
- Discord support (12h response)
- Bug fixes + monthly updates
- Feature requests considered

**Enterprise Package:**
- 365 days support
- Priority support (4h response)
- Unlimited bug fixes
- Monthly feature updates
- Dedicated Slack channel

---

## Related Documentation

- [05-backend-systems.md](../05-backend-systems.md) - Backend API design
- [08-operations.md](../08-operations.md) - Project management workflows
- [09-marketing.md](../09-marketing.md) - Marketing strategy

---

**Last Updated:** November 2025
**Status:** ✅ Production Ready
