# PriceWiseApp Installation Guide

## Prerequisites

Before you can run PriceWiseApp, you need to install:

1. **Node.js and npm**: 
   - Download and install from [nodejs.org](https://nodejs.org/)
   - Recommended version: Node.js 16.x or later

2. **Firebase Account**:
   - Create a free account at [firebase.google.com](https://firebase.google.com/)

## Step 1: Install Node.js and npm

1. Download Node.js installer from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the instructions
3. Verify installation by opening Command Prompt or PowerShell and running:
   ```
   node -v
   npm -v
   ```

## Step 2: Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the steps to create a new project
3. Once the project is created, click on the web icon (</>) to add a web app
4. Register your app with a name (e.g., "PriceWiseApp")
5. Copy the Firebase configuration object (it looks like this):
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyAJoxRfdc2WyZLupuPacUtOvvVdktTgIJE",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "1036399950997",
     appId: "YOUR_APP_ID"
   };
   ```

6. Enable Authentication:
   - In Firebase Console, go to "Authentication" > "Sign-in method"
   - Enable "Email/Password" and "Google" sign-in methods

7. Set up Firestore Database:
   - Go to "Firestore Database" > "Create database"
   - Start in production mode (or test mode for development)
   - Choose a location close to your users

8. Set up Storage:
   - Go to "Storage" > "Get started"
   - Accept the default settings

## Step 3: Update Firebase Configuration

1. Open `src/services/firebase.js` in a text editor
2. Replace the placeholder firebaseConfig object with your own configuration from Step 2

## Step 4: Install Dependencies and Run the App

### Using Command Prompt:

1. Open Command Prompt
2. Navigate to the PriceWiseApp directory:
   ```
   cd path\to\PriceWiseApp
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the application:
   ```
   npm start
   ```
   
### Using the provided batch file:

1. Double-click on `start.bat` in the PriceWiseApp directory

### Using PowerShell:

1. Right-click on `start.ps1` in the PriceWiseApp directory
2. Select "Run with PowerShell"

Alternatively, you might need to set the execution policy:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\start.ps1
```

## Troubleshooting

### "npm is not recognized as an internal or external command"
- Make sure Node.js is properly installed
- Try restarting your computer to ensure PATH variables are updated

### PowerShell execution policy issues
- If you receive an error about running scripts, you can run:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
  Then try running the start.ps1 script again

### Firebase connection issues
- Verify that your firebaseConfig in `src/services/firebase.js` matches the one from your Firebase console
- Check that you've enabled the necessary services (Authentication, Firestore, Storage)

### Browser geolocation not working
- Make sure you're using a secure context (HTTPS or localhost)
- Allow location permissions when prompted by the browser 