# Developer Guide - Royalties Catalogue

Welcome to the Royalties Catalogue codebase! This guide will help junior developers understand the project structure, key concepts, and how everything fits together.

## 🏗️ Project Architecture Overview

This is a **React + TypeScript** application built with **Vite** that manages music royalties for independent artists. The app uses the **Adapter Pattern** for data access, allowing easy switching between mock data (for development) and a real database.

### Key Design Principles

1. **Type Safety First** - Everything is strictly typed with TypeScript
2. **Financial Precision** - All money stored as integers in minor units (pence) to avoid floating-point errors
3. **Deterministic Allocation** - Same inputs always produce same outputs for auditability
4. **Separation of Concerns** - Clear separation between UI, business logic, and data access
5. **Responsive Design** - Works on desktop and mobile with proper breakpoints

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components (Button, Card, Table, etc.)
│   └── Navigation.tsx   # Left sidebar navigation with responsive design
├── data/                # Mock data JSON files for development
│   ├── holders.json     # Sample royalty holders
│   ├── releases.json    # Sample music releases
│   ├── transactions.json # Sample revenue/payout transactions
│   └── ...
├── lib/                 # Core business logic and utilities
│   ├── allocation.ts    # 🧮 CORE: Revenue allocation engine
│   ├── data-adapter.ts  # Interface defining all data operations
│   ├── mock-adapter.ts  # Implementation using JSON files
│   ├── data-service.ts  # Factory for creating data adapters
│   ├── constants.ts     # Currency formatting and app constants
│   ├── analytics.ts     # Time period filtering and performance metrics
│   └── utils.ts         # General utilities (mainly for CSS classes)
├── pages/               # Main application pages/screens
│   ├── Dashboard.tsx    # Release performance analytics
│   ├── Holders.tsx      # List of all royalty holders
│   ├── HolderDetail.tsx # Individual holder details and payout interface
│   ├── Releases.tsx     # List of all music releases
│   └── ReleaseDetail.tsx # Individual release details and splits
├── types/               # TypeScript type definitions
│   └── index.ts         # All interfaces and types used throughout the app
└── App.tsx              # Root component with routing and layout
```

## 🎯 Core Concepts

### 1. Financial Model (Minor Units)

**All monetary amounts are stored as integers in minor units (pence):**

```typescript
// ❌ Don't store: 20.50 (floating point issues)
// ✅ Do store: 2050 (integer pence)

const amount = 2050;  // Represents £20.50
const formatted = formatCurrency(amount);  // "£20.50"
```

**Why?** Floating-point arithmetic can cause precision errors in financial calculations. Storing everything as integers eliminates this issue.

### 2. Royalty Allocation System

The heart of the application is the **revenue allocation engine** (`src/lib/allocation.ts`):

```typescript
// When revenue comes in, it gets split among holders based on percentages
const transaction = { amount: 10000, type: 'revenue', release_id: 'release-1' };

// Gets allocated based on release splits (e.g., 70% / 30%)
const allocations = allocateRevenue(transaction, releases, tracks, splits);
// Result: [{ holder_id: 'holder-1', amount: 7000 }, { holder_id: 'holder-2', amount: 3000 }]
```

**Key Algorithm: Largest Remainder Method**
- Prevents money from being "lost" to rounding
- Ensures allocations sum to exactly the original amount
- Provides deterministic results (same inputs = same outputs)

### 3. Split Inheritance Logic

Tracks can either inherit splits from their parent release or have custom splits:

```typescript
// Track inherits from release (use_release_splits: true)
track.use_release_splits = true → use release_splits table

// Track has custom splits (use_release_splits: false) 
track.use_release_splits = false → use track_splits table
```

### 4. Data Adapter Pattern

All data access goes through the `DataAdapter` interface:

```typescript
// This works the same whether using mock data or a real database
const holders = await dataService.holders.getAll();
const balance = await dataService.holders.getBalances();
```

**Current Implementations:**
- `MockAdapter` - Uses JSON files and localStorage (development)
- `SupabaseAdapter` - Future: Will use Supabase database (production)

## 🧮 Understanding the Allocation Engine

This is the most complex part of the system. Here's how it works:

### Step 1: Determine Which Splits to Use

```typescript
if (transaction.track_id) {
  const track = tracks.find(t => t.id === transaction.track_id);
  
  if (track.use_release_splits) {
    // Use release-level splits
    splits = releaseSplits.filter(s => s.release_id === track.release_id);
  } else {
    // Use track-specific splits
    splits = trackSplits.filter(s => s.track_id === track.id);
  }
}
```

### Step 2: Apply Largest Remainder Method

```typescript
// Example: £1.00 (100p) split 33.33% / 33.33% / 33.34%

// Step 1: Calculate exact amounts
// 33.33p, 33.33p, 33.34p

// Step 2: Floor all amounts  
// 33p, 33p, 33p = 99p (1p remainder)

// Step 3: Calculate decimal remainders
// 0.33, 0.33, 0.34

// Step 4: Give remaining pennies to largest remainders
// Final: 33p, 33p, 34p = 100p ✓
```

## 🎨 UI Architecture

### Component Structure

- **shadcn/ui components** - Reusable, accessible UI primitives
- **Page components** - Top-level route components  
- **Navigation** - Responsive sidebar with mobile support

### Styling Approach

- **Tailwind CSS** for all styling
- **CSS Variables** for theming (supports light/dark modes)
- **Blue theme** as the primary brand color
- **Responsive design** with mobile-first approach

### Key Files:

```typescript
// shadcn/ui components
src/components/ui/button.tsx    // All button variants
src/components/ui/card.tsx      // Card layouts
src/components/ui/table.tsx     // Data tables

// Utility for combining Tailwind classes
src/lib/utils.ts                // cn() function for conditional styling
```

## 🔍 How Data Flows Through the App

### 1. Dashboard Page Example

```typescript
// 1. Component loads and fetches data
useEffect(() => {
  const { startDate, endDate } = getDateRange(timePeriod);
  const transactions = await dataService.transactions.getByDateRange(startDate, endDate);
  const releases = await dataService.releases.getAll();
  
  // 2. Calculate performance metrics
  const performance = calculateReleasePerformance(releases, tracks, transactions);
  setReleasePerformance(performance);
}, [timePeriod]);

// 3. Render results in UI
{releasePerformance.map(perf => (
  <TableRow key={perf.release.id}>
    <TableCell>{perf.release.title}</TableCell>
    <TableCell>{formatCurrency(perf.totalRevenue)}</TableCell>
  </TableRow>
))}
```

### 2. Payout Process Example

```typescript
// 1. User enters payout amount
const handlePayout = async (amount) => {
  // 2. Create payout transaction (negative amount)
  const transaction = await dataService.transactions.create({
    type: 'payout',
    amount: -amount,  // Negative to reduce balance
    holder_id: holderId,
    description: `Payout to ${holder.name}`
  });
  
  // 3. Balances automatically recalculate on next load
  const updatedBalances = await dataService.holders.getBalances();
};
```

## 🧪 Testing Strategy

### Current Tests

- **Allocation engine** - Comprehensive unit tests for financial logic
- **Rounding methods** - Tests for largest remainder algorithm  
- **Split validation** - Tests for business rule enforcement
- **Balance calculation** - Integration tests for multi-transaction scenarios

### Test Files

```typescript
src/lib/__tests__/allocation.test.ts    // 18 tests covering allocation logic
```

### Key Test Scenarios

- Exact division scenarios (no remainder)
- Complex percentage splits with remainders
- Edge cases (single penny amounts)
- Deterministic behavior (same inputs = same outputs)
- Error conditions (invalid splits, missing data)

## 🚀 Getting Started as a Developer

### 1. Environment Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test
```

### 2. Key Environment Variables

```bash
# .env file
VITE_DATA_SOURCE=mock  # Uses JSON files for data
# VITE_DATA_SOURCE=supabase  # Future: Use Supabase database
```

### 3. Understanding the Data

Look at the sample data files to understand the data model:

- `src/data/holders.json` - See how royalty holders are structured
- `src/data/releases.json` - See how music releases are organized
- `src/data/transactions.json` - See how revenue and payouts work
- `src/data/release-splits.json` - See how royalties are divided

### 4. Adding New Features

When adding features, follow this pattern:

1. **Add types** to `src/types/index.ts`
2. **Add data methods** to `src/lib/data-adapter.ts` interface
3. **Implement in mock adapter** `src/lib/mock-adapter.ts`
4. **Create UI components** using existing patterns
5. **Add tests** for any business logic
6. **Update this documentation**

## 🔧 Common Tasks

### Adding a New Page

1. Create component in `src/pages/NewPage.tsx`
2. Add route to `src/App.tsx`
3. Add navigation link to `src/components/Navigation.tsx`

### Modifying Financial Logic

1. Update `src/lib/allocation.ts` 
2. Add tests to `src/lib/__tests__/allocation.test.ts`
3. Test with different scenarios to ensure accuracy

### Changing UI Styling

1. Modify Tailwind classes in components
2. Update theme colors in `src/index.css` if needed
3. Ensure responsive behavior works on mobile

## 📚 Key Libraries and Tools

- **React 18** - UI framework with hooks
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Lucide React** - Beautiful icons
- **Vitest** - Fast testing framework

## ❓ Common Questions

**Q: Why are amounts stored as integers?**
A: Floating-point math has precision issues. Storing £20.50 as 2050 pence avoids this.

**Q: How do I add a new royalty holder?**
A: Use `dataService.holders.create()` - the system handles ID generation and timestamps.

**Q: What happens when splits don't add up to 100%?**
A: The system will throw an error and prevent the invalid configuration.

**Q: How does the mobile navigation work?**
A: The `Navigation` component shows a hamburger menu on small screens and a fixed sidebar on large screens.

**Q: Where is the database?**
A: Currently using mock data in JSON files. Future versions will integrate with Supabase.

---

## 🤝 Contributing

When working on this codebase:

1. **Follow TypeScript best practices** - Use proper typing
2. **Write tests for business logic** - Especially financial calculations
3. **Comment complex algorithms** - Help future developers understand your code
4. **Use existing UI patterns** - Stay consistent with the design system
5. **Test responsive behavior** - Ensure mobile compatibility

Happy coding! 🎵💰