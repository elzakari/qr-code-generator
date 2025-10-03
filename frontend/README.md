# QR Code Generator Frontend

A modern, responsive React application for generating and managing QR codes with advanced customization options.

## Features

### Core Functionality
- **QR Code Generation**: Create QR codes from text, URLs, or other data
- **Logo Upload**: Add custom logos to QR codes
- **Advanced Customization**: 
  - Error correction levels (L, M, Q, H)
  - Custom colors (foreground/background)
  - Size adjustment
  - Rounded corners
- **Real-time Preview**: See QR code changes instantly
- **Download**: Export QR codes as PNG images

### User Management
- **Authentication**: Secure login and registration
- **User Profile**: Manage account settings and preferences
- **Dashboard**: View and manage generated QR codes
- **Search & Filter**: Find specific QR codes quickly

### UI/UX Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Material-UI**: Modern, accessible interface
- **Dark Mode Support**: Toggle between light and dark themes
- **Notifications**: Real-time feedback for user actions
- **Error Handling**: Comprehensive error management

## Technology Stack

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - Component library and design system
- **React Router** - Client-side routing
- **React Hook Form** - Form management and validation
- **Zustand** - State management
- **Axios** - HTTP client for API communication
- **Jest & React Testing Library** - Testing framework

## Project Structure

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qr-generator/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_VERSION=1.0.0
   ```

4. **Start development server**
   ```bash
   npm start
   ```

   The application will open at `http://localhost:3000`

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## API Integration

The frontend communicates with the backend API through service classes:

### QR Service (`qr.service.ts`)
- `generateQR(formData)` - Generate new QR code
- `getUserQRCodes(page, limit)` - Get user's QR codes
- `deleteQR(qrId)` - Delete QR code
- `downloadQR(qrId)` - Download QR code image
- `searchQRCodes(query)` - Search QR codes

### Auth Service (`auth.service.ts`)
- `login(credentials)` - User authentication
- `register(userData)` - User registration
- `logout()` - User logout
- `getCurrentUser()` - Get current user info

## State Management

### Auth Store (Zustand)
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
}
```

### QR Store (Zustand)
```typescript
interface QRState {
  recentQRs: QRCode[];
  currentQR: QRCode | null;
  isLoading: boolean;
  error: string | null;
  addQR: (qr: QRCode) => void;
  setCurrentQR: (qr: QRCode | null) => void;
  clearQRs: () => void;
}
```

## Component Architecture

### QRGenerator Component
- Form handling with React Hook Form
- File upload for logos
- Real-time preview
- Validation and error handling
- Responsive grid layout

### Dashboard Component
- Paginated QR code list
- Search and filter functionality
- Bulk operations
- Download and delete actions

### Navigation Component
- Responsive navigation bar
- Mobile drawer menu
- User profile dropdown
- Route highlighting

## Testing

The project includes comprehensive tests using Jest and React Testing Library:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
- Component rendering
- User interactions
- API integration
- Error handling
- Form validation

## Deployment

### Production Build
```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### Environment Variables
Set these environment variables for production:

```env
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_VERSION=1.0.0
NODE_ENV=production
```

### Deployment Options
- **Netlify**: Connect GitHub repo for automatic deployments
- **Vercel**: Zero-config deployment for React apps
- **AWS S3 + CloudFront**: Static hosting with CDN
- **Docker**: Containerized deployment

## Performance Optimizations

- **Code Splitting**: Lazy loading of route components
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Image Optimization**: Optimized logo uploads
- **Caching**: Service worker for offline functionality
- **Memoization**: React.memo for expensive components

## Accessibility

- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG 2.1 AA compliance
- **Focus Management**: Proper focus handling
- **Semantic HTML**: Meaningful HTML structure

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use Material-UI components
- Follow the existing code style
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.