# DEVTRIX Session Generator

A WhatsApp Bot Session Generator using Pairing Code. This application is designed for deployment on **Render**.

## Features

- 🚀 Web-based session generator
- 📱 WhatsApp pairing code support
- 🎨 Modern UI with responsive design
- 🔒 Secure session handling
- ⚡ Fast and lightweight

## Prerequisites

- Node.js >= 20.0.0
- npm >= 9.7.2

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Extontony/Session.git
cd Session
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Local Development

```bash
npm start
```

The application will start on `http://localhost:5000` (or the port specified in the `PORT` environment variable).

### Deployment on Render

This project is configured for deployment on [Render](https://render.com).

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Select this repository
4. Configure the following:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     - `PORT`: 5000 (optional, Render provides default)
     - `NODE_ENV`: production

The deployment will automatically handle all dependencies and start your application.

## API Endpoints

### Get Pairing Code
```
GET /code?number=<phone_number>
```

**Parameters:**
- `number` (required): Phone number with country code (e.g., 263781206xxx)

**Response:**
```json
{
  "code": "XXXXX-XXXXX"
}
```

## Architecture

- **Backend:** Express.js
- **Frontend:** HTML5 + Vanilla JavaScript
- **Session Library:** @whiskeysockets/baileys
- **Dependencies:** Listed in `package.json`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment type |
| MESSAGE | - | Custom message (optional) |

## File Structure

```
.
├── itxxwasi.js          # Main server file
├── index.html           # Main page
├── pair.html            # Pairing code page
├── pair.js              # Pairing logic
├── qr.js                # QR code generation
├── wasiqr.js            # WhatsApp QR handling
├── id.js                # ID generation
├── package.json         # Dependencies
├── render.yml           # Render deployment config
└── README.md            # This file
```

## Security Notes

- This application is for educational purposes
- Always use HTTPS in production
- Never expose sensitive session data
- Keep your dependencies updated

## License

GPL-3.0

## Author

WasiTech / Extontony

## Support

For issues and feature requests, please create an issue on GitHub.

---

**Note:** This project is optimized for Render deployment. cPanel and traditional hosting are no longer supported.
