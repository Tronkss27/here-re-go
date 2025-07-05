# SPOrTS - Guida Sviluppo

## 🚀 Setup Ambiente di Sviluppo

### Prerequisiti Obbligatori
- **Node.js 18+** (LTS raccomandato)
- **npm 9+** 
- **Docker Desktop** (per sviluppo con containers)
- **Git** (per version control)
- **VS Code** (editor raccomandato)

### Estensioni VS Code Raccomandate
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "ms-vscode-remote.remote-containers",
    "mongodb.mongodb-vscode"
  ]
}
```

### Setup Iniziale

1. **Clone e Setup**
   ```bash
   git clone https://github.com/your-repo/sports.git
   cd sports
   npm run install:all
   ```

2. **Configurazione Environment**
   ```bash
   # Root level
   cp .env.example .env
   
   # Backend specific
   cp backend/.env.example backend/.env
   ```

3. **Database Setup**
   ```bash
   # Con Docker (raccomandato)
   npm run docker:dev
   
   # O manualmente con MongoDB locale
   npm run seed
   ```

## 🏗️ Architettura del Progetto

### Struttura Directory
```
SPOrTS/
├── .cursor/               # Cursor IDE rules
├── backend/               # Node.js API
│   ├── src/
│   │   ├── config/        # Database, server config
│   │   ├── controllers/   # Route handlers
│   │   ├── middlewares/   # Auth, validation, etc.
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Helper functions
│   ├── scripts/           # CLI tools, seeding
│   └── tests/             # Unit/integration tests
├── frontend/              # React Application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Route components
│   │   ├── services/      # API calls
│   │   └── utils/         # Helper functions
│   └── public/            # Static assets
├── docs/                  # Project documentation
└── scripts/               # Global scripts
```

### Pattern di Sviluppo

#### Backend (Node.js + Express)
- **MVC Pattern**: Model-View-Controller
- **Middleware Chain**: Auth → Validation → Controller
- **Error Handling**: Centralized error middleware
- **Database**: MongoDB con Mongoose ODM

#### Frontend (React 18)
- **Component Structure**: Atomic design
- **State Management**: Context API + useReducer
- **Styling**: Tailwind CSS con componenti custom
- **Routing**: React Router v6

## 📝 Convenzioni di Coding

### JavaScript/TypeScript
```javascript
// Naming conventions
const API_BASE_URL = 'https://api.example.com'  // SCREAMING_SNAKE_CASE per costanti
const userName = 'john_doe'                      // camelCase per variabili
const UserProfile = () => {}                     // PascalCase per componenti

// Function declarations
const fetchUserData = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching user:', error)
    throw error
  }
}

// Component structure
const UserCard = ({ user, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleUpdate = async () => {
    setIsLoading(true)
    try {
      await onUpdate(user.id)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="p-4 border rounded-lg">
      {/* Component content */}
    </div>
  )
}
```

### File Naming
```
components/
├── ui/
│   ├── Button.jsx           # PascalCase per componenti
│   ├── Input.jsx
│   └── Modal.jsx
├── auth/
│   ├── LoginForm.jsx
│   └── RegisterForm.jsx
└── layout/
    ├── Header.jsx
    └── Footer.jsx

services/
├── authService.js           # camelCase per servizi
├── apiService.js
└── storageService.js

utils/
├── formatters.js            # camelCase per utilities
├── validators.js
└── constants.js
```

### CSS/Tailwind
```css
/* Utility-first approach */
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors;
}

/* Component-specific classes */
.venue-card {
  @apply bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow;
}

/* Responsive design */
.hero-section {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}
```

## 🔄 Workflow di Sviluppo

### Branch Strategy
```
main                 # Production ready code
├── develop          # Development integration
├── feature/auth     # Feature branches
├── feature/booking  
├── hotfix/security  # Emergency fixes
└── release/v1.0     # Release preparation
```

### Commit Messages
```bash
# Format: type(scope): description

feat(auth): add JWT token refresh mechanism
fix(booking): resolve date validation issue  
docs(api): update authentication endpoints
style(ui): improve button spacing
refactor(db): optimize venue queries
test(auth): add integration tests
chore(deps): update React to v18.2
```

### Pull Request Process
1. **Feature Branch**: Crea branch da `develop`
2. **Development**: Implementa feature con test
3. **Code Review**: PR verso `develop`
4. **Testing**: CI/CD pipeline + manual testing
5. **Merge**: Squash merge in `develop`

## 🧪 Testing

### Struttura Testing
```
tests/
├── unit/                  # Unit tests
│   ├── components/
│   ├── services/
│   └── utils/
├── integration/           # Integration tests
│   ├── api/
│   └── database/
└── e2e/                   # End-to-end tests
    ├── auth.test.js
    ├── booking.test.js
    └── search.test.js
```

### Test Commands
```bash
# Frontend tests
npm run frontend:test        # Jest + React Testing Library
npm run frontend:test:watch  # Watch mode
npm run frontend:test:coverage

# Backend tests  
npm run backend:test         # Jest + Supertest
npm run backend:test:watch
npm run backend:test:coverage

# E2E tests
npm run test:e2e            # Playwright/Cypress
```

### Test Examples
```javascript
// Component test
import { render, screen, fireEvent } from '@testing-library/react'
import LoginForm from '../LoginForm'

test('shows validation error for invalid email', async () => {
  render(<LoginForm />)
  
  const emailInput = screen.getByLabelText(/email/i)
  const submitButton = screen.getByRole('button', { name: /login/i })
  
  fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
  fireEvent.click(submitButton)
  
  expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument()
})

// API test
const request = require('supertest')
const app = require('../app')

describe('POST /api/auth/login', () => {
  test('returns JWT token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@sports.it',
        password: 'demo123'
      })
      .expect(200)
      
    expect(response.body).toHaveProperty('token')
    expect(response.body.user.email).toBe('demo@sports.it')
  })
})
```

## 🚀 Deployment

### Environment Configs
```bash
# Development
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/sports-dev

# Production  
NODE_ENV=production
PORT=80
MONGO_URI=mongodb://prod-cluster/sports
JWT_SECRET=super-secure-secret
```

### Docker Production
```bash
# Build production images
npm run docker:prod

# Environment-specific compose
docker-compose -f docker-compose.prod.yml up -d

# Health checks
curl http://localhost/health
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
    
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm run install:all
      - run: npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          docker build -t sports-app .
          docker push registry/sports-app:latest
```

## 🐛 Debug e Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MongoDB status
docker ps | grep mongo

# View MongoDB logs
docker logs sports_mongodb_dev

# Connect to MongoDB shell
docker exec -it sports_mongodb_dev mongosh
```

#### API Errors
```bash
# Check backend logs
docker logs sports_backend_dev

# Test API endpoints
curl -X GET http://localhost:5000/health
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@sports.it","password":"demo123"}'
```

#### Frontend Issues
```bash
# Clear node modules
rm -rf frontend/node_modules frontend/package-lock.json
cd frontend && npm install

# Check frontend logs
npm run frontend:dev

# Build issues
npm run frontend:build
```

### Debug Tools

#### Backend Debugging
```javascript
// Add debug logging
const debug = require('debug')('sports:auth')
debug('User login attempt:', { email: req.body.email })

// Environment-based logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data)
}
```

#### Frontend Debugging
```javascript
// React DevTools
import { useDebugValue } from 'react'

const useAuth = () => {
  const [user, setUser] = useState(null)
  useDebugValue(user ? `Logged in: ${user.email}` : 'Not logged in')
  return { user, setUser }
}

// Console debugging
console.group('Auth Flow')
console.log('User:', user)
console.log('Token:', token)
console.groupEnd()
```

## 📊 Performance

### Monitoring
- **Frontend**: Web Vitals, Lighthouse
- **Backend**: Response times, memory usage
- **Database**: Query performance, indexes

### Optimization Tips
```javascript
// React optimization
const MemoizedComponent = React.memo(({ data }) => (
  <div>{data.title}</div>
))

// Database optimization
// Good: Indexed field query
await Venue.find({ city: 'Milano' })

// Bad: Full collection scan
await Venue.find({ description: /pizza/ })

// API optimization
// Good: Pagination
await Venue.find().limit(20).skip(page * 20)

// Good: Field selection
await Venue.find().select('name location rating')
```

## 🔧 Utilities e Scripts

### Seeding Database
```bash
# Populate with demo data
npm run seed

# Custom seeding
cd backend && node scripts/seed.js --venues=50 --bookings=200
```

### Database Operations
```bash
# Backup database
mongodump --uri="mongodb://localhost:27017/sports" --out=./backup

# Restore database
mongorestore --uri="mongodb://localhost:27017/sports" ./backup/sports

# Reset database
npm run db:reset
```

### Code Quality
```bash
# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Type checking (if using TypeScript)
npm run type-check
```

---

## 📚 Risorse Aggiuntive

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Manual](https://docs.mongodb.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Testing Library](https://testing-library.com)

Per domande specifiche, controlla:
1. **Issues GitHub** per problemi noti
2. **API Documentation** in `docs/api.md`
3. **Component Storybook** (se configurato)
4. **Team Chat** per supporto diretto 