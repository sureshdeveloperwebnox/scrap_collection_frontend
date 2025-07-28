# Scrap Collection Service - Admin Dashboard

A comprehensive Next.js admin dashboard for managing scrap vehicle collection services across Australia. This application provides a complete interface for managing leads, orders, employees, collectors, scrap yards, payments, and generating reports.

## 🚀 Features

### Core Modules
- **Dashboard Overview** - Key metrics and recent activity
- **Lead Management** - CRUD operations for customer leads
- **Order Management** - Track pickup requests and assignments
- **Employee Management** - Manage staff with role-based access
- **Collector Management** - Track collector performance and location
- **Scrap Yard Management** - Monitor capacity and operations
- **Payment Management** - Handle transactions and refunds
- **Reports & Analytics** - Performance insights and data visualization
- **Settings** - System configuration and user preferences

### Key Features
- 📱 Responsive design for all screen sizes
- 🎨 Modern UI with ShadCN components
- 📊 Real-time dashboard with key metrics
- 🔍 Advanced search and filtering
- 📋 Complete CRUD operations
- 🚚 Auto-assignment of collectors to orders
- 💳 Payment tracking and management
- 📈 Performance analytics and reporting
- ⚙️ Configurable system settings

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN/UI + Radix UI
- **Icons**: Lucide React
- **Tables**: TanStack Table (React Table)
- **Charts**: Recharts (ready for integration)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── collectors/         # Collector management
│   ├── employees/          # Employee management
│   ├── leads/             # Lead management
│   ├── orders/            # Order management
│   ├── payments/          # Payment management
│   ├── reports/           # Analytics and reports
│   ├── scrap-yards/       # Scrap yard management
│   ├── settings/          # System settings
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout with AuthProvider
│   └── page.tsx           # Dashboard home
├── components/            # Reusable components
│   ├── ui/               # ShadCN UI components
│   ├── dashboard-layout.tsx # Protected dashboard wrapper
│   ├── dashboard-stats.tsx
│   ├── employee-form.tsx
│   ├── header.tsx
│   ├── lead-form.tsx
│   ├── order-form.tsx
│   ├── protected-route.tsx # Route protection component
│   └── sidebar.tsx        # Navigation with auth state
├── context/              # React Context providers
│   └── auth-context.tsx  # Authentication state management
├── hooks/                # Custom React Query hooks
│   ├── use-dashboard.ts  # Dashboard analytics hooks
│   ├── use-leads.ts      # Lead management hooks
│   ├── use-orders.ts     # Order management hooks
│   ├── use-employees.ts  # Employee management hooks
│   ├── use-collectors.ts # Collector tracking hooks
│   ├── use-scrap-yards.ts# Scrap yard management hooks
│   ├── use-payments.ts   # Payment processing hooks
│   └── index.ts          # Hook exports
├── lib/                  # Utility functions and configuration
│   ├── api/              # API service layer
│   │   ├── client.ts     # Axios client with interceptors
│   │   ├── dashboard.ts  # Dashboard API calls
│   │   ├── leads.ts      # Lead API calls
│   │   ├── orders.ts     # Order API calls
│   │   ├── employees.ts  # Employee API calls
│   │   ├── collectors.ts # Collector API calls
│   │   ├── scrap-yards.ts# Scrap yard API calls
│   │   ├── payments.ts   # Payment API calls
│   │   └── index.ts      # API exports
│   ├── query-client.ts   # TanStack Query configuration
│   └── utils.ts          # Utility functions
└── types/                # TypeScript type definitions
    └── index.ts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd front_end
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## ⚠️ Important Notes

- **No Authentication**: The application currently runs without authentication for simplicity
- **Mock Data**: All data is mocked for demonstration purposes
- **Public Access**: All pages are publicly accessible
- **Development Ready**: Ready for API integration and authentication implementation

## 📊 Data Models

### Core Entities
- **Lead**: Customer inquiries with contact details and vehicle information
- **Order**: Pickup requests with assignment and tracking
- **Employee**: Staff members with roles and permissions
- **Collector**: Field workers with performance metrics
- **ScrapYard**: Processing facilities with capacity tracking
- **Payment**: Transaction records with status and methods

### Vehicle Types
- Car
- Bike  
- Truck
- Boat

### Scrap Categories
- Junk
- Accident-Damaged
- Fully Scrap

## 🎨 UI Components

Built with ShadCN/UI components including:
- **Forms**: Input, Select, Label, Dialog
- **Data Display**: Table, Card, Badge
- **Navigation**: Sidebar, Header
- **Feedback**: Buttons, Loading states
- **Layout**: Responsive grid system

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MAPS_API_KEY=your-google-maps-key
STRIPE_PUBLIC_KEY=your-stripe-public-key
```

### Customization
- **Colors**: Modify `tailwind.config.ts` for brand colors
- **Navigation**: Update `sidebar.tsx` for menu items
- **API Integration**: Replace mock data with real API calls

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Deploy to Vercel
```bash
npx vercel --prod
```

### Deploy to Other Platforms
- Build the application with `npm run build`
- Serve the `.next` folder with a Node.js server

## 🤝 API Integration

The application is designed to work with a Node.js/PostgreSQL backend. Replace mock data in components with actual API calls:

```typescript
// Example API integration
const fetchLeads = async () => {
  const response = await fetch('/api/leads');
  return response.json();
};
```

## 📈 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Google Maps integration for collector tracking
- [ ] Advanced analytics with charts
- [ ] Mobile app integration
- [ ] Email notification system
- [ ] Role-based authentication
- [ ] File upload for vehicle photos
- [ ] Advanced reporting with PDF export

## 🐛 Known Issues

- Mock data is used for demonstration
- Authentication is not implemented
- API integration needs to be completed
- Charts are placeholder components

## 📞 Support

For support and questions, contact the development team or refer to the project documentation.

## 📄 License

This project is proprietary software for Scrap Collection Services.

---

**Built with ❤️ using Next.js and TypeScript**