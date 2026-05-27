# Basic Diet Dashboard

A modern, responsive dashboard application for managing diet plans, subscriptions, users, and meal packages. Built with React, TypeScript, Vite, and shadcn/ui.

## 🚀 Features

- **Authentication System**: Secure login with token-based authentication
- **Dashboard Overview**: Real-time statistics and key metrics visualization
- **Package Management**: Create, edit, and manage diet packages with various options
- **Subscription Management**: Handle user subscriptions, including freeze, extend, and cancel operations
- **User Management**: Complete CRUD operations for user accounts
- **Meal & Addon Management**: Comprehensive food item management system
- **Responsive Design**: Mobile-friendly interface with adaptive layouts
- **Dark/Light Theme**: Automatic theme detection with manual override capability
- **Data Tables**: Interactive tables with sorting, filtering, and pagination
- **Form Validation**: Robust form validation using React Hook Form and Zod
- **API Integration**: Axios-based API client with automatic token handling and error normalization

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **Routing**: TanStack Router
- **Forms**: React Hook Form with Zod validation
- **Data Visualization**: Recharts for charts and graphs
- **Drag & Drop**: @dnd-kit for sortable lists
- **Animations**: Motion for smooth transitions
- **Notifications**: Sonner for toast notifications
- **Icons**: Lucide React
- **Date Handling**: Date-fns
- **Cookies**: js-cookie for token storage
- **HTTP Client**: Axios with interceptors

### Development Tools
- **Linting**: ESLint with React hooks plugin
- **Formatting**: Prettier with Tailwind CSS plugin
- **Type Checking**: TypeScript
- **Testing**: (To be implemented)

## 📁 Project Structure

```
client_dashbourd/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── global/         # Global components (toasts, loaders, etc.)
│   │   ├── layout/         # Layout components (sidebar, header, etc.)
│   │   ├── pages/          # Page-specific components
│   │   │   ├── dashboard/  # Dashboard page components
│   │   │   ├── packages/   # Package management components
│   │   │   ├── subscriptions/ # Subscription management
│   │   │   └── users/      # User management components
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries and configurations
│   ├── routes/             # Application routes
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # API utility functions
│   ├── constants/          # Static data and configurations
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── public/                 # Static assets
├── .gitignore              # Git ignore rules
├── .prettierignore         # Prettier ignore rules
├── eslint.config.js        # ESLint configuration
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.css     # Tailwind CSS configuration
├── tsconfig.app.json       # TypeScript configuration for app
├── tsconfig.json           # Base TypeScript configuration
├── tsconfig.node.json      # TypeScript configuration for node
└── vite.config.ts          # Vite configuration
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Backend API running (configured via VITE_BACKEND_URL environment variable)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd client_dashbourd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_BACKEND_URL=http://your-backend-api-url.com
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

## 📱 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint for code quality
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking
- `npm run preview` - Preview production build

## 🔐 Authentication

The application uses JWT-based authentication:
- Tokens are stored in cookies (`dashboardToken`)
- Automatic token attachment to API requests via Axios interceptors
- Automatic redirect to login on 401 Unauthorized responses
- Token removal on logout or session expiration

## 📡 API Integration

All API calls are centralized in `src/lib/apis.ts`:
- Base URL configured via `VITE_BACKEND_URL` environment variable
- Automatic JSON content type handling
- Arabic language preference set in headers
- Centralized error handling with message normalization
- Automatic token injection from cookies
- Automatic redirect on authentication errors

### Key API Utilities
Located in `src/utils/`, these functions encapsulate API endpoints:
- Dashboard data fetching (`fetchGetDashboardData`)
- Package management (`fetchCreatePackage`, `fetchUpdatePackage`, etc.)
- Subscription operations
- User management
- Meal and addon CRUD operations
- Settings and configuration endpoints

## 🎨 UI Components

The application uses shadcn/ui components built on Radix UI primitives:
- **Cards**: For displaying information in containers
- **Buttons**: Various button variants and sizes
- **Forms**: Input fields, labels, validation states
- **Tables**: Data tables with sorting capabilities
- **Dialogs**: Modal windows for forms and confirmations
- **Drawers**: Slide-in panels for secondary actions
- **Tabs**: Tabbed interfaces for organizing content
- **Badges**: Status indicators
- **Tooltips**: Hover explanations
- **Loading States**: Spinners and skeleton loaders
- **Charts**: Data visualization components
- **Drag & Drop**: Reorderable lists

## 🧩 Custom Components

### Authentication
- `LoginForm`: Secure login form with email/password validation

### Dashboard
- Overview cards showing key metrics
- Recent activity feeds
- Status indicators and trend indicators

### Packages
- Package listing with filtering and sorting
- Package creation/edit forms
- Gram options section with drag-and-drop reordering
- Freeze policy configuration

### Subscriptions
- Subscription listing with detailed views
- Subscription creation workflow
- Modify subscription options (delivery, premium meals, etc.)
- Action buttons (freeze, extend, cancel)

### Users
- User listing with role and status filtering
- User creation/edit forms
- Subscription assignment capabilities

## 📊 Data Visualization

- **Charts**: Using Recharts for displaying trends and statistics
- **Metrics Cards**: Key performance indicators with visual indicators
- **Activity Feeds**: Timeline of recent actions and events

## 🌐 Internationalization

The application is primarily designed for Arabic-speaking users:
- Arabic language set in API request headers
- RTL (Right-to-Left) layout support through Tailwind CSS
- Arabic text throughout the interface
- Date formatting using date-fns with Arabic locale

## 🔒 Security Features

- **HTTP-only Cookies**: For secure token storage
- **Automatic Token Handling**: Axios interceptor injects tokens
- **Session Invalidations**: Automatic logout on 401 responses
- **Input Validation**: Both client-side (Zod) and server-side validation
- **Error Message Sanitization**: Prevents leaking sensitive information
- **Protected Routes**: Route-level authentication checks

## 🧪 Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent naming conventions
- Write self-documenting code with clear variable/function names
- Use ESLint and Prettier for code quality

### Component Organization
- Place reusable components in `src/components/ui/`
- Page-specific components in their respective page directories
- Custom hooks in `src/hooks/`
- Utility functions in `src/lib/` and `src/utils/`
- Types in `src/types/`

### State Management
- Use React Query for server state management
- Use React Context for global UI state (theme, etc.)
- Use React Hook Form for form state
- Avoid prop drilling by lifting state up appropriately

### API Usage
- Always use the centralized API client from `src/lib/apis.ts`
- Handle loading and error states in components
- Normalize error messages using the API interceptor
- Cancel stale requests where appropriate

## 🚨 Error Handling

The application implements comprehensive error handling:
- **API Level**: Centralized error normalization in `src/lib/apis.ts`
- **Component Level**: Error boundaries and fallback UIs
- **User Feedback**: Toast notifications for success/error states
- **Logging**: Console logging for development debugging
- **Graceful Degradation**: Fallback content when data fails to load

## 📱 Responsive Design

The dashboard is fully responsive:
- **Mobile**: Single column layout with collapsible sidebar
- **Tablet**: Adaptive grid layouts
- **Desktop**: Full sidebar with main content area
- **Breakpoints**: Tailwind CSS responsive prefixes (sm, md, lg, xl, 2xl)

## 🎯 Future Enhancements

Planned improvements for the application:
- [ ] Unit and integration testing with Vitest
- [ ] End-to-end testing with Playwright
- [ ] Role-based access control (RBAC)
- [ ] Advanced filtering and search capabilities
- [ ] Export functionality (PDF, CSV)
- [ ] Scheduled reports and notifications
- [ ] Multi-language support (English/Arabic toggle)
- [ ] Performance optimization and code splitting
- [ ] Accessibility improvements (WCAG compliance)
- [ ] Dark mode persistence and system preference detection
- [ ] Real-time updates with WebSocket integration
- [ ] Help documentation and tooltips
- [ ] User onboarding tour
- [ ] Analytics and usage tracking

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components
- [Radix UI](https://www.radix-ui.com/) for primitive UI components
- [React Query](https://tanstack.com/query/v5) for server state management
- [TanStack Router](https://tanstack.com/router/v1) for type-safe routing
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Vite](https://vitejs.dev/) for fast development experience
- [Lucide](https://lucide.dev/) for beautiful icons
- [Recharts](https://recharts.org/) for data visualization
- [Motion](https://motion.dev/) for animations
- [Sonner](https://sonner.emilkowalski.ski/) for toast notifications
- [Date-fns](https://date-fns.org/) for date manipulation
- [Zod](https://zod.dev/) for schema validation
- [React Hook Form](https://react-hook-form.com/) for form management
- [Axios](https://axios-http.com/) for HTTP client
- [js-cookie](https://github.com/js-cookie/js-cookie) for cookie management
- [@dnd-kit](https://dndkit.com/) for drag and drop functionality
- [Class Variance Authority](https://cva.style/) for component variants
- [Clsx](https://github.com/lukeed/clsx) for conditional class names
- [Tailwind Merge](https://tailwind-merge.kaisermann.de/) for merging Tailwind classes
- [Next Themes](https://next-themes.vercel.app/) for theme management
- [Vaul](https://vaul.pub/) for bottom sheet component

---
*Built with ❤️ using modern web technologies*# client_dashbourd
