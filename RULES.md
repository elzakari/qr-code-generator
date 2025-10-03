# QR Code Generator - Development Rules & Guidelines

## 🎯 Project Overview
This document establishes the development rules and guidelines for the QR Code Generator full-stack web application. All future code sessions must adhere to these standards to ensure consistency, maintainability, and successful project completion.

---

## 📋 Project Context

### Current Status
- **Backend**: ✅ Complete Flask API with authentication, QR generation, and database models
- **Frontend**: ⚠️ Partial React/TypeScript setup with Material-UI
- **Database**: ✅ SQLAlchemy models (User, QRCode) with migrations
- **Authentication**: ✅ Flask-Login backend, ❌ Frontend integration missing
- **API**: ✅ REST endpoints functional, ❌ Frontend integration incomplete

### Technology Stack
- **Backend**: Flask 3.0.3, Python 3.11+, SQLAlchemy, Flask-Login
- **Frontend**: React 19.1.1, TypeScript 5.8.3, Material-UI 7.3.2, Vite 7.1.2
- **State Management**: Redux Toolkit 2.9.0 + Zustand 5.0.8
- **Testing**: Vitest 3.2.4, Testing Library, pytest
- **Deployment**: Docker, Heroku-ready

---

## 🏗️ Architecture Rules

### 1. Backend Architecture (Flask)

**Rules:**
- ✅ DO NOT modify existing backend structure - it's complete and functional
- ✅ All new backend features must follow the existing blueprint pattern
- ✅ Use existing validation functions in `validators.py`
- ✅ Maintain rate limiting (10 requests/minute per user)
- ✅ Keep CSRF protection enabled for all forms

### 2. Frontend Architecture (React)

**Rules:**
- ✅ Use TypeScript for all new components
- ✅ Follow Material-UI design system
- ✅ Implement responsive design (mobile-first)
- ✅ Use React Hook Form for all forms
- ✅ Implement proper error boundaries
- ✅ Add loading states for all async operations

---

## 🔐 Authentication Rules

### Backend Authentication (Complete)
- ✅ Flask-Login session management implemented
- ✅ Password hashing with Werkzeug
- ✅ User model with admin capabilities
- ✅ Protected routes with `@login_required`

### Frontend Authentication (TO IMPLEMENT)
**MUST IMPLEMENT:**
```typescript
// Required authentication components
- LoginForm.tsx
- RegisterForm.tsx
- AuthProvider.tsx (context)
- ProtectedRoute.tsx (wrapper)
- UserMenu.tsx (header component)
```

**Rules:**
- ✅ Use React Context for authentication state
- ✅ Implement persistent login (localStorage/sessionStorage)
- ✅ Add proper logout functionality
- ✅ Handle authentication errors gracefully
- ✅ Redirect unauthenticated users to login

---

## 🎨 UI/UX Rules

### Design System
- ✅ Use Material-UI components exclusively
- ✅ Follow Material Design 3 principles
- ✅ Implement consistent spacing (8px grid)
- ✅ Use theme-based colors and typography
- ✅ Ensure WCAG 2.1 AA accessibility compliance

### Component Structure
```typescript
// Standard component template
interface ComponentProps {
  // Props definition
}

const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // Hooks
  // State
  // Effects
  // Handlers
  
  return (
    // JSX with proper accessibility
  );
};

export default Component;
```

### Responsive Design Rules
- ✅ Mobile-first approach (320px+)
- ✅ Tablet breakpoint (768px+)
- ✅ Desktop breakpoint (1024px+)
- ✅ Use Material-UI breakpoints system
- ✅ Test on multiple screen sizes

---

## 🔌 API Integration Rules

### Existing Backend Endpoints
```typescript
// Available endpoints (DO NOT MODIFY)
POST /auth/login          // User login
POST /auth/register       // User registration
POST /auth/logout         // User logout
POST /generate            // Generate QR (form-based)
POST /api/generate        // Generate QR (JSON API)
GET /download/<id>        // Download QR code
GET /dashboard            // User dashboard data
```

### Frontend API Service Rules
**MUST CREATE:**
```typescript
// services/api.ts
class ApiService {
  // Authentication methods
  login(credentials: LoginCredentials): Promise<User>
  register(userData: RegisterData): Promise<User>
  logout(): Promise<void>
  
  // QR Code methods
  generateQR(params: QRParams): Promise<QRResponse>
  downloadQR(id: string): Promise<Blob>
  getUserQRs(): Promise<QRCode[]>
  deleteQR(id: string): Promise<void>
}
```

**Rules:**
- ✅ Use Axios for HTTP requests
- ✅ Implement request/response interceptors
- ✅ Handle authentication tokens properly
- ✅ Add comprehensive error handling
- ✅ Implement retry logic for failed requests
- ✅ Use TypeScript interfaces for all API responses

---

## 📊 State Management Rules

### Redux Toolkit Setup
```typescript
// store/slices/
├── authSlice.ts         // Authentication state
├── qrSlice.ts           // QR generation state
├── uiSlice.ts           // UI state (loading, errors)
└── index.ts             // Store configuration
```

### State Structure
```typescript
interface RootState {
  auth: {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
  };
  qr: {
    currentQR: QRCode | null;
    history: QRCode[];
    generating: boolean;
    error: string | null;
  };
  ui: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    notifications: Notification[];
  };
}
```

**Rules:**
- ✅ Use Redux Toolkit for global state
- ✅ Use Zustand for component-level state
- ✅ Implement proper loading states
- ✅ Handle errors at the state level
- ✅ Use selectors for derived state

---

## 🧪 Testing Rules

### Backend Testing (Existing)
- ✅ pytest framework implemented
- ✅ Test coverage for models and routes
- ✅ Security testing included

### Frontend Testing (TO IMPLEMENT)
**Required Test Types:**
```typescript
// Component tests
- QRGenerator.test.tsx
- Dashboard.test.tsx
- Auth components tests

// Integration tests
- API service tests
- Authentication flow tests
- QR generation flow tests

// E2E tests
- User registration/login
- Complete QR generation workflow
- Dashboard functionality
```

**Rules:**
- ✅ Use Vitest + Testing Library
- ✅ Aim for 80%+ test coverage
- ✅ Test user interactions, not implementation
- ✅ Mock API calls in component tests
- ✅ Test accessibility features

---

## 🚀 Development Workflow Rules

### Git Workflow
```bash
# Branch naming convention
feature/auth-components
bugfix/qr-generation-error
hotfix/security-patch
```

### Commit Messages
```bash
# Format: type(scope): description
feat(auth): add login component
fix(qr): resolve color picker issue
docs(readme): update installation guide
test(api): add QR generation tests
```

### Code Quality Rules
- ✅ Run ESLint before commits
- ✅ Format code with Prettier
- ✅ Type-check with TypeScript
- ✅ Run tests before pushing
- ✅ Update documentation for new features

---

## 📁 File Organization Rules

### Component Files
```typescript
// components/QRGenerator/
├── QRGenerator.tsx      // Main component
├── QRGenerator.test.tsx // Tests
├── QRGenerator.types.ts // Type definitions
├── QRGenerator.styles.ts// Styled components (if needed)
└── index.ts             // Export barrel
```

### Import Order
```typescript
// 1. React and external libraries
import React from 'react';
import { Button, TextField } from '@mui/material';

// 2. Internal utilities and types
import { ApiService } from '../services/api';
import { QRParams } from '../types/qr';

// 3. Relative imports
import './Component.styles.css';
```

---

## 🔒 Security Rules

### Frontend Security
- ✅ Sanitize all user inputs
- ✅ Validate file uploads client-side
- ✅ Use HTTPS in production
- ✅ Implement CSP headers
- ✅ Avoid storing sensitive data in localStorage

### Backend Security (Implemented)
- ✅ CSRF protection enabled
- ✅ Rate limiting implemented
- ✅ Input validation on all endpoints
- ✅ Secure file upload handling
- ✅ SQL injection prevention

---

## 🎯 Priority Implementation Order

### Phase 1: Authentication Frontend (CRITICAL)
1. Create authentication context and provider
2. Build login/register components
3. Implement protected routes
4. Add user menu and logout functionality

### Phase 2: QR Generator UI (HIGH)
1. Complete QR generator form component
2. Add real-time preview functionality
3. Implement file upload for logos
4. Create results display component

### Phase 3: Dashboard Implementation (HIGH)
1. Build dashboard layout
2. Display QR code history
3. Add search and filter functionality
4. Implement download/delete actions

### Phase 4: Polish & Testing (MEDIUM)
1. Add comprehensive error handling
2. Implement loading states
3. Add accessibility features
4. Write comprehensive tests

---

## ❌ What NOT to Do

### Backend
- ❌ DO NOT modify existing database models
- ❌ DO NOT change existing API endpoints
- ❌ DO NOT remove security middleware
- ❌ DO NOT alter authentication logic

### Frontend
- ❌ DO NOT use CSS frameworks other than Material-UI
- ❌ DO NOT implement custom authentication (use existing backend)
- ❌ DO NOT bypass TypeScript type checking
- ❌ DO NOT ignore accessibility requirements

### General
- ❌ DO NOT commit without testing
- ❌ DO NOT push directly to main branch
- ❌ DO NOT ignore linting errors
- ❌ DO NOT skip documentation updates

---

## 📚 Reference Documentation

### Key Files to Reference
- `PRD.md` - Complete project requirements
- `qrapp/routes.py` - Backend API endpoints
- `qrapp/models.py` - Database schema
- `frontend/package.json` - Available dependencies
- `requirements.txt` - Backend dependencies

### External Documentation
- [Material-UI Documentation](https://mui.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [Flask Documentation](https://flask.palletsprojects.com/)

---

## 🎯 Success Criteria

### Technical Metrics
- [ ] All components properly typed with TypeScript
- [ ] 80%+ test coverage on frontend
- [ ] Zero accessibility violations
- [ ] Mobile-responsive design
- [ ] Sub-3-second page load times

### Functional Metrics
- [ ] Complete user authentication flow
- [ ] Functional QR code generation with all customization options
- [ ] Working user dashboard with history
- [ ] File upload and download functionality
- [ ] Error handling and loading states

### Code Quality Metrics
- [ ] Zero ESLint errors
- [ ] Consistent code formatting
- [ ] Proper component structure
- [ ] Comprehensive documentation
- [ ] Clean git history

---

**Remember**: This project has a solid backend foundation. Focus on creating a polished, user-friendly frontend that leverages the existing API effectively. Always refer to this document and the PRD before making architectural decisions.