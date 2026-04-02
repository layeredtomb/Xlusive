# 📱 Phone Number Data Leak Checker

A full-stack application that allows users to check if their phone numbers have been compromised in data breaches or leaked from databases. This project provides a clean, modern UI for scanning phone numbers against multiple data leak sources and requesting removal from databases.

## 🎯 Features

- **Phone Number Checking**: Search your phone number against known data breaches
- **Multiple Data Sources**: Integration with various data leak databases and breach detection services
- **Beautiful UI**: Modern, responsive interface built with React
- **Check History**: Keep track of all your phone number checks
- **Removal Requests**: Request removal of your number from compromised databases
- **Privacy First**: Your data is not stored on external servers
- **Local Storage**: Check history is saved locally in your browser

## 🏗️ Project Structure

```
phonenumberchecker/
├── server/                 # Node.js Express backend
│   ├── index.js           # Main server file
│   ├── package.json       # Server dependencies
│   ├── services/          # Business logic
│   │   └── phoneChecker.js
│   └── database/          # Database utilities
│       └── db.js
├── client/                # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   ├── index.css      # Global styles
│   │   ├── main.jsx       # React entry point
│   │   └── components/    # React components
│   │       ├── PhoneChecker.jsx
│   │       ├── ResultsDisplay.jsx
│   │       └── History.jsx
│   ├── index.html
│   ├── package.json       # Client dependencies
│   └── vite.config.js     # Vite configuration
├── package.json           # Root package.json
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** version 16.0.0 or higher
- **npm** (comes with Node.js)

### Installation

1. **Install Dependencies**

   ```bash
   npm run install-deps
   ```

   This will install dependencies for:
   - Root project
   - Server (`server/`)
   - Client (`client/`)

### Running the Application

**Development Mode** (Runs both server and client):

```bash
npm run dev
```

This command will:
- Start the backend server on `http://localhost:5000`
- Start the frontend dev server on `http://localhost:3000`

**Server Only**:

```bash
npm run server
```

**Client Only**:

```bash
cd client && npm run dev
```

### Building for Production

```bash
npm run build
```

This creates an optimized build of the client in the `client/dist/` directory.

## 📡 API Endpoints

### Health Check

```http
GET /api/health
```

Returns server status and timestamp.

### Check Phone Number

```http
POST /api/check-phone
Content-Type: application/json

{
  "phoneNumber": "+1 (555) 123-4567"
}
```

**Response:**

```json
{
  "success": true,
  "phoneNumber": "+1 (555) 123-4567",
  "foundInLeaks": true,
  "leakSources": [
    {
      "name": "DataBreach-2023-001",
      "date": "2023-01-15",
      "affectedRecords": 500000,
      "source": "E-commerce Platform"
    }
  ],
  "message": "Phone number found in 1 data breach(es)",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get Check History

```http
GET /api/history
```

Returns the 50 most recent phone checks with their results.

### Request Removal

```http
POST /api/request-removal
Content-Type: application/json

{
  "phoneNumber": "+1 (555) 123-4567",
  "leakSource": "DataBreach-2023-001"
}
```

## 🔐 Security & Privacy

- **100% FREE** - No payment required, ever!
- **Local Storage**: Check results are stored locally in your browser
- **No Data Sharing**: Your phone numbers are not stored on our servers
- **HTTPS Ready**: Configure HTTPS in production
- **CORS Protection**: API is protected with CORS headers
- **Input Validation**: Phone numbers are validated before checking
- **FREE APIs Only**: Uses only free data sources and APIs

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **SQLite3** - Lightweight database
- **Axios** - HTTP client
- **CORS** - Cross-origin resource sharing
- **Dotenv** - Environment variable management

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **Axios** - HTTP client for API calls
- **CSS3** - Styling

## 📚 Usage Guide

### Checking a Phone Number

1. Navigate to the **"Check Phone"** tab
2. Enter your phone number in any format
3. Click **"Check Now"**
4. View results showing if your number was found in any breaches

### Viewing History

1. Click the **"Check History"** tab
2. See all your previous checks with:
   - Phone number
   - Date/time of check
   - Number of breaches found
   - List of affected databases

### Requesting Removal

1. If your number is found in a breach
2. Click **"Request Removal"** on the specific breach
3. Our system will submit a removal request to the database operator
4. You'll receive updates on the removal status

## 🔗 Integrations

The system can be extended to integrate with:

- **Have I Been Pwned API** - Email/phone breach checking
- **Breach Databases** - PublicDB, LeakDB, and similar services
- **Dark Web Monitoring** - Automatic scanning of dark web leaks
- **Removal Services** - Direct integration with database operators for automatic removal

## 📊 Environment Variables

Create a `.env` file in the server directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_PATH=./database/phoneChecker.db
```

## 🐛 Troubleshooting

### Server won't start

```bash
# Make sure port 5000 is available
# Check if Node.js is installed
node --version

# Clear node_modules and reinstall
rm -rf node_modules server/node_modules client/node_modules
npm run install-deps
```

### Frontend won't connect to backend

- Ensure the backend server is running on port 5000
- Check the proxy setting in `client/vite.config.js`
- Clear browser cache and refresh page

### Database errors

- Delete `server/database/phoneChecker.db` to reset database
- Ensure write permissions in the server directory

## 📈 Future Enhancements

- [ ] Real-time dark web scanning
- [ ] Automatic IP-based breach alerts
- [ ] SMS notifications for new breaches
- [ ] Multi-language support
- [ ] Advanced filtering and search
- [ ] Data export functionality
- [ ] Browser extension
- [ ] Mobile app integration

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## 📞 Support

For issues or questions, please open an issue in the repository.

---

**Remember**: Always check your phone numbers regularly to stay informed about data breaches!
