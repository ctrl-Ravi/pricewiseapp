# PriceWiseApp

PriceWiseApp is a React application that allows users to track and compare product prices across different locations.

## Features

- Add products with prices, shop information, and location data
- View product price history
- Search for products by name
- Find nearby price entries based on your current location
- User authentication with Firebase

## Firebase Integration

This app uses Firebase for:
- Authentication (email/password and Google sign-in)
- Firestore Database (to store products and price entries)
- Storage (for product photos)

## Project Structure

```
PriceWiseApp/
├── public/            # Public assets
├── src/
│   ├── components/    # Reusable UI components
│   │   ├── Product.js
│   │   └── PriceEntry.js
│   ├── screens/       # Application screens
│   │   ├── AddProductScreen.js
│   │   ├── LoginScreen.js
│   │   ├── NearbyPricesScreen.js
│   │   ├── ProductHistoryScreen.js
│   │   └── SearchProductScreen.js
│   ├── services/      # Services (Firebase, etc.)
│   │   ├── firebase.js
│   │   └── FirebaseService.js
│   ├── App.css        # Global styles
│   ├── App.js         # Main component with routing
│   └── index.js       # Entry point
└── package.json       # Dependencies
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Update Firebase configuration in `src/services/firebase.js` with your own Firebase project credentials
4. Start the development server:
   ```
   npm start
   ```

## Firebase Configuration

To use this app, you need to create a Firebase project and update the configuration in `src/services/firebase.js` with your own credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Firestore Database Structure

The app uses the following Firestore collections:

- `products`: Stores product information
  - Fields: `productName`, `productSlug`, `category`
  
- `price_entries`: Stores price entries for products
  - Fields: `productId`, `price`, `shopName`, `location`, `locationName`, `timestamp`, `userId`, `photoURL` 