# Remix - Business Management Platform

# Live - URL [Remix](https://remix-4iih.onrender.com)

A comprehensive business management solution built with React, TypeScript, and Supabase. Remix streamlines operations across inventory management, purchasing, sales, point of sale (POS), human resources, and more.

## 🚀 Features

### Core Modules

- **📊 Dashboard**: Real-time business analytics and insights
- **🏪 Point of Sale (POS)**: Complete POS system with inventory integration
- **📦 Inventory Management**: Track products, stock levels, warehouses, and locations
- **💰 Sales & Purchases**: Manage sales orders, purchase orders, and invoices
- **👥 Human Resources**: Employee management, payroll, and attendance tracking
- **🏢 Branch Management**: Multi-branch support with centralized control
- **📈 Reports**: AI-powered analytics and business intelligence
- **💬 Messages & Inquiries**: Internal communication and customer inquiry management
- **🛍️ E-commerce Shop**: Online store integration with admin panel
- **👤 Contacts**: Customer and supplier relationship management
- **💳 Accounts**: Financial accounting and transaction management
- **⚙️ Settings**: User management, roles, access groups, and system configuration

### Key Capabilities

- **Multi-language Support**: Built-in internationalization (i18n)
- **Dark/Light Theme**: Theme switching with next-themes
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Powered by Supabase real-time subscriptions
- **Form Validation**: Robust form handling with React Hook Form and Zod
- **State Management**: Efficient state management with Zustand
- **Rich UI Components**: Built with Radix UI and shadcn/ui
- **Data Visualization**: Interactive charts with Recharts
- **Animations**: Smooth animations with Framer Motion

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Radix UI** - Accessible component primitives

### Backend & Database
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Storage

### State & Data Management
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### UI & Styling
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **next-themes** - Theme management

### Development Tools
- **TypeScript ESLint** - TypeScript-specific linting


## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **bun** package manager
- **Git**

## 🚀 Getting Started


```

### 1. Install Dependencies

Using npm:
```bash
npm install
```

Or using bun:
```bash
bun install
```

### 2. Environment Setup

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
graduation-project/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   │   ├── pos/         # Point of Sale module
│   │   ├── inventory/   # Inventory management
│   │   ├── sales/       # Sales module
│   │   ├── purchases/   # Purchase management
│   │   ├── hr/          # Human resources
│   │   ├── reports/     # Analytics and reports
│   │   ├── settings/    # System settings
│   │   ├── shop/        # E-commerce frontend
│   │   └── ...          # Other modules
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── integrations/    # External service integrations
│   ├── i18n/            # Internationalization
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Application entry point
├── supabase/            # Supabase configuration and migrations
├── public/              # Static assets
└── package.json         # Project dependencies
```

## 🔐 Authentication

The application uses Supabase Authentication with support for:
- Email/Password login
- Role-based access control (RBAC)
- User groups and permissions
- Session management

## 📊 Database

The application uses Supabase (PostgreSQL) with the following key tables:
- Products & Inventory
- Warehouses & Locations
- Sales & Purchase Orders
- Employees & HR data
- Customers & Suppliers
- Financial Accounts
- And more...

Database migrations and schemas are located in the `supabase/` directory.

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) components, which are:
- Accessible (built on Radix UI)
- Customizable
- Copy-paste friendly
- Built with Tailwind CSS

Component configuration is in `components.json`.



Configuration: `playwright.config.ts`

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Hosting

The built application can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

Ensure environment variables are configured in your hosting platform.

## 🔧 Configuration Files

- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.js` - ESLint configuration
- `components.json` - shadcn/ui configuration
- `playwright.config.ts` - Playwright test configuration

## 📝 Recent Updates

### Stock Management Improvements
- Fixed product stock calculation across multiple warehouses and locations
- Resolved stock duplication issues
- Improved POS stock deduction accuracy
- Enhanced inventory tracking and reporting

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is part of a graduation project.

## 👥 Authors

Graduation Project Team

## 📞 Support

For issues and questions, please refer to the project documentation or contact the development team.

---

**Built with ❤️ using React, TypeScript, and Supabase**
