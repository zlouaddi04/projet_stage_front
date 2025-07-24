# LaFarge Holcim Inventory Management System

A responsive web application for inventory management with three distinct interfaces: login, admin panel, and user panel.

## 🚀 Features

### Login Interface
- Secure authentication system
- Forgot password functionality
- Role-based access control
- Responsive design

### Admin Panel
- **Dashboard**: Overview of statistics and recent activity
- **Search Items**: Advanced search by name, code, or family
- **Manage Items**: Add, edit, and delete inventory items
- **Manage Users**: User management with role assignment
- **Search History**: Track all user search activities
- **Item Movements**: Record and track inventory movements

### User Panel
- **Search Items**: Find items by name, code, or family (optional)
- **Search History**: Personal search history tracking
- **Profile**: View profile and request password reset

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, TypeScript
- **Storage**: LocalStorage (for demo purposes)
- **Design**: Responsive design with mobile-first approach
- **No Frameworks**: Pure vanilla JavaScript/TypeScript implementation

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers (1200px+)
- Tablets (768px - 1024px)
- Mobile phones (320px - 767px)

## 🔐 Demo Credentials

### Admin Access
- **Email**: admin@lafargeholcim.com
- **Password**: admin123

### User Access
- **Email**: john.doe@lafargeholcim.com
- **Password**: user123

- **Email**: jane.smith@lafargeholcim.com
- **Password**: user456

## 📁 Project Structure

```
Projet_LaFargeHolcim_Front-end/
├── index.html              # Login page
├── admin.html              # Admin panel
├── user.html               # User panel
├── styles/
│   ├── login.css           # Login page styles
│   ├── admin.css           # Admin panel styles
│   ├── user.css            # User panel styles
│   └── enhancements.css    # Additional UI enhancements
├── scripts/
│   ├── auth.ts             # Authentication logic
│   ├── admin.ts            # Admin panel functionality
│   └── user.ts             # User panel functionality
├── data/
│   └── mock-data.json      # Sample data for testing
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- Node.js and npm (for development server and TypeScript support)

### Quick Start

#### Option 1: Using npm (Recommended for TypeScript)
1. Clone or download the project
2. Open terminal in the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. The application will open automatically in your browser at `http://localhost:8080`
6. Use the demo credentials below to login

#### Option 2: Using Live Server (VS Code)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html` and select "Open with Live Server"
3. The application will open in your browser
4. Login with demo credentials

#### Option 3: Python Simple Server
```bash
# Navigate to project directory
cd Projet_LaFargeHolcim_Front-end

# Python 3
python -m http.server 8000

# Open http://localhost:8000 in your browser
```

### Development Commands
```bash
# Start development server
npm run start

# Type check TypeScript files
npm run type-check

# Build project (compile TypeScript)
npm run build
```

## 📊 Mock Data

The application includes comprehensive mock data:
- **10 Sample Items** covering different categories (Cement, Equipment, Steel, Aggregates, Concrete)
- **5 Users** with different roles and statuses
- **Sample Search History** demonstrating user activity
- **Movement Records** showing inventory transactions

## 🔧 Features in Detail

### Search Functionality
- **By Name**: Partial matching, case-insensitive
- **By Code**: Exact or partial code matching
- **By Family**: Category-based filtering
- **Combined Search**: Multiple criteria supported

### Admin Capabilities
- Full CRUD operations on items and users
- Real-time statistics dashboard
- Comprehensive search history tracking
- Movement logging and tracking
- Export functionality (planned)

### User Experience
- Intuitive sidebar navigation
- Mobile-responsive design
- Real-time feedback
- Search history tracking
- Password reset requests

## 🔒 Security Features

- Session-based authentication
- Role-based access control
- Input validation
- XSS protection measures
- Secure password handling (demo only)

## 📱 Mobile Features

- Touch-friendly interface
- Collapsible sidebar navigation
- Optimized for small screens
- Swipe gestures support
- Mobile-first design approach

## 🛡️ Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔄 Data Persistence

Currently uses LocalStorage for demo purposes. In production, this would be replaced with:
- REST API endpoints
- Database integration
- Real-time synchronization
- Backup and recovery

## 🚧 Future Enhancements

- [ ] Real API integration
- [ ] Advanced filtering options
- [ ] Export functionality (PDF, Excel)
- [ ] Barcode scanning support
- [ ] Real-time notifications
- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] Mobile app version

## 📝 Development Notes

### TypeScript Development

The application is built with TypeScript for better code quality and type safety. Modern browsers can directly execute TypeScript files when served through a local server.

#### TypeScript Features Used:
- **Strong Typing**: All variables, functions, and classes are properly typed
- **Interfaces**: Clear data structure definitions for Items, Users, etc.
- **Classes**: Object-oriented architecture for better code organization
- **Modules**: ES6 module system for clean imports/exports
- **Null Safety**: Strict null checking to prevent runtime errors

#### Code Structure:
```
scripts/
├── auth.ts       # Authentication logic with strong typing
├── admin.ts      # Admin panel with comprehensive type definitions
└── user.ts       # User panel with type-safe operations
```

### Code Structure
- Modular design with separate concerns
- Class-based architecture
- Event-driven programming
- Responsive design patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is created for LaFarge Holcim as part of an internship project.

## 📞 Support

For questions or support, please contact the development team.

---

**Note**: This is a demonstration application using mock data. In a production environment, proper backend integration, security measures, and data validation would be implemented.
