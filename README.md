# Royalties Catalogue

A web application for single artists to manage music royalties, built with React, Vite, Tailwind CSS, and shadcn/ui components. This open-source solution provides essential functionality for tracking releases, managing royalty holders, recording revenue transactions, and handling payouts with configurable thresholds.

## Features

### MVP1 - Core Ledger & Splits
- ✅ **Releases Management** - CRUD operations for albums, EPs, and singles
- ✅ **Royalty Holders** - Manage recipients with contact and payment details  
- ✅ **Release Splits** - Configure percentage allocations that sum to 100%
- ✅ **Revenue Tracking** - Manual entry of revenue transactions
- ✅ **Allocation Engine** - Splits applied with largest-remainder rounding method
- ✅ **Balance Calculation** - Real-time computation of holder balances
- ✅ **Payout Transactions** - Record payments that reduce owed balances
- ✅ **Threshold Enforcement** - Configurable minimum payout amounts (default £20)
- ✅ **Dashboard** - Overview of holders with balances and payout status
- ✅ **Holder Details** - Activity history and payout recording interface

### Planned Features (MVP2 & MVP3)
- 🔄 Track-level management with split overrides
- 🔄 Basic reporting and analytics
- 🔄 CSV statement exports  
- ✅ Supabase integration with R number and catalog number auto-generation
- 🔄 Comprehensive testing suite

## Architecture

### Data Layer
- **Adapter Pattern** - Pluggable data sources (Supabase/Mock)
- **Supabase Mode** - Default operation with PostgreSQL database
- **Mock Mode** - Fallback using local JSON files
- **Type Safety** - Full TypeScript coverage for entities and operations

### Business Logic
- **Allocation Engine** - Deterministic revenue distribution
- **Rounding Logic** - Largest remainder method ensures exact totals
- **Threshold Rules** - Automatic payout eligibility calculation
- **Balance Computation** - Real-time aggregation of earnings and payments

### UI Components  
- **shadcn/ui** - Consistent, accessible component library
- **Responsive Design** - Desktop and mobile optimized
- **Real-time Updates** - Immediate reflection of data changes

## Quick Start

### Prerequisites
- Node.js 22.x
- npm or pnpm package manager

### Installation

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd royalties-catalogue
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   ```
   The application defaults to Supabase database. Set up your database following `supabase-setup-instructions.md`.

4. **Start development server:**
   ```bash
   npm run dev
   # or  
   pnpm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173`

The application will load with demo data including:
- 2 royalty holders with different payout thresholds
- 2 releases (1 single, 1 album with 3 tracks) 
- Configured release splits totaling 100%
- Sample revenue and payout transactions
- 1 track with custom split override

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run test suite
- `npm run test:ui` - Run tests with UI

## Data Model

### Core Entities

**Holders** - Royalty recipients
- Personal/business information
- Payment details and contact info
- Custom payout threshold overrides

**Releases** - Albums, EPs, singles
- Metadata (title, artist, UPC, release date)
- Default royalty split percentages
- Track relationship management

**Tracks** - Individual songs
- Release association and track numbering
- ISRC codes for identification
- Optional split overrides (inherits from release by default)

**Transactions** - Financial records
- Revenue, payout, and adjustment entries
- Linked to releases or specific tracks
- Immutable audit trail with timestamps

### Business Rules

**Split Inheritance Logic:**
- `use_release_splits = true` → Apply release-level splits
- `use_release_splits = false` + track splits exist → Apply track-level splits  
- `use_release_splits = false` + no track splits → Error state

**Allocation Formula:**
- `owed_amount = floor(transaction_amount × split_percentage ÷ 100)`
- Remainder distributed one penny at a time by lowest holder_id
- Ensures exact total matching with deterministic rounding

**Threshold Enforcement:**
- Payable status: `owed_balance ≥ threshold_amount`
- Below threshold: carried forward to next period
- Admin override: allows advance payments creating negative balances

## Environment Configuration

### Supabase Mode (Default)
```env
# Required - get from your Supabase project dashboard
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
Data stored in PostgreSQL database with auto-generated R numbers and catalog numbers.

### Mock Mode (Fallback)
```env
VITE_DATA_SOURCE=mock
```
Data stored in JSON files under `src/data/`, optionally persisted to localStorage.

## File Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   └── Navigation.tsx   # App navigation
├── data/                # Mock data JSON files
├── lib/
│   ├── allocation.ts    # Revenue allocation engine
│   ├── constants.ts     # Currency and formatting utilities
│   ├── data-adapter.ts  # Data access interface
│   ├── data-service.ts  # Adapter factory
│   ├── mock-adapter.ts  # Mock implementation
│   └── utils.ts         # Utility functions
├── pages/               # Route components
├── types/               # TypeScript definitions
└── App.tsx             # Main application component
```

## Currency Handling

All monetary amounts are stored as **integers in minor units** (pence):
- £20.00 stored as `2000`
- £0.01 stored as `1`
- Default minimum payout: `2000` (£20.00)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes following the existing code style
4. Add tests for new functionality
5. Submit a pull request

### Code Standards
- Use TypeScript for all new code
- Follow existing component patterns
- Add comments for complex business logic
- Ensure splits and financial calculations are testable
- Maintain deterministic behavior for money operations

## License

[Add your license here]

## Roadmap

**MVP2 - Tracks & Reporting**
- Track CRUD operations with split overrides
- Workspace settings management  
- Basic analytics and reporting
- CSV export functionality
- Comprehensive test coverage

**MVP3 - Security & Auth**
- Supabase authentication and user management
- Row Level Security implementation  
- Audit trail enhancements
- Production deployment guides

---

Built with ❤️ for independent artists and small labels.