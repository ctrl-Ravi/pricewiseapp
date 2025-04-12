import { db } from './firebase';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Product from '../models/Product';
import PriceEntry from '../models/PriceEntry';
// eslint-disable-next-line no-unused-vars
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  startAt,
  endAt,
  limit,
  Timestamp,
  GeoPoint,
  serverTimestamp,
  collectionGroup,
  updateDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';

// Helper function to create a slug from a product name
const createSlug = (productName) => {
  return productName
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

// Helper function to calculate distance between two coordinates (in km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

class FirebaseService {
  // Add a new product to the 'products' collection
  async addProduct(productName, category = null) {
    try {
      console.log(`Adding product: ${productName}, category: ${category}`);
      
      // Generate slug from product name
      let productSlug = createSlug(productName);
      
      // Check if the product with this slug already exists
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('productSlug', '==', productSlug));
      const querySnapshot = await getDocs(q);
      
      // If product with this slug exists, append a unique identifier
      if (!querySnapshot.empty) {
        productSlug = `${productSlug}-${Date.now()}`;
        console.log(`Slug already exists, new slug: ${productSlug}`);
      }
      
      // Create the product
      const product = new Product(productName, productSlug, category);
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'products'), product.toFirestore());
      console.log(`Product added with ID: ${docRef.id}`);
      
      return { id: docRef.id, ...product };
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }
  
  // Upload photo to Firebase Storage and get URL
  async uploadProductPhoto(file, productId) {
    try {
      console.log(`Uploading photo for product ${productId}`);
      
      if (!file) return null;
      
      const storageRef = ref(storage, `product_photos/${productId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`Photo uploaded, URL: ${downloadURL}`);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }
  
  // Add a new price entry to the 'price_entries' collection
  async addPriceEntry(productId, price, shopName = null, location = null, locationName = null, userId = null, photoURL = null, isPublic = true, timestamp = null, quantity = 1, unit = 'pc', unitPrice = null) {
    try {
      console.log(`Adding price entry for product ${productId}, price: ${price}, isPublic: ${isPublic}, quantity: ${quantity} ${unit}`);
      
      const priceEntry = new PriceEntry(
        productId,
        price,
        shopName,
        location,
        locationName,
        timestamp || Timestamp.now(),
        userId,
        photoURL,
        isPublic,
        quantity,
        unit,
        unitPrice
      );
      
      const docRef = await addDoc(collection(db, 'price_entries'), priceEntry.toFirestore());
      console.log(`Price entry added with ID: ${docRef.id}`);
      
      return { id: docRef.id, ...priceEntry };
    } catch (error) {
      console.error('Error adding price entry:', error);
      throw error;
    }
  }
  
  // Get all products (for debugging and display)
  async getAllProducts() {
    try {
      console.log('Getting all products');
      
      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);
      
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...Product.fromFirestore(doc)
      }));
      
      console.log(`Found ${products.length} products`);
      return products;
    } catch (error) {
      console.error('Error getting all products:', error);
      throw error;
    }
  }
  
  // Get a product by its ID
  async getProductById(productId) {
    try {
      console.log(`Getting product by ID: ${productId}`);
      
      const docRef = doc(db, 'products', productId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log(`No product found with ID: ${productId}`);
        return null;
      }
      
      return { id: docSnap.id, ...Product.fromFirestore(docSnap) };
    } catch (error) {
      console.error('Error getting product by ID:', error);
      throw error;
    }
  }
  
  // Get a product by its slug
  async getProductBySlug(productSlug) {
    try {
      console.log(`Getting product by slug: ${productSlug}`);
      
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('productSlug', '==', productSlug));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log(`No product found with slug: ${productSlug}`);
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      console.log(`Found product: ${doc.data().productName}`);
      return { id: doc.id, ...Product.fromFirestore(doc) };
    } catch (error) {
      console.error('Error getting product by slug:', error);
      throw error;
    }
  }
  
  // Search products by name
  async searchProductsByName(searchTerm) {
    try {
      console.log(`Searching products with term: ${searchTerm}`);
      
      // First try exact name search (case insensitive)
      const productsRef = collection(db, 'products');
      let results = [];
      
      // Try direct search (more reliable than ordering/range)
      const directQuery = query(
        productsRef,
        where('productName', '>=', searchTerm.toLowerCase()),
        where('productName', '<=', searchTerm.toLowerCase() + '\uf8ff')
      );
      
      const directSnapshot = await getDocs(directQuery);
      console.log(`Found ${directSnapshot.size} results with direct query`);
      
      // If no direct results, get all products and filter manually
      if (directSnapshot.empty) {
        const allProductsSnapshot = await getDocs(productsRef);
        console.log(`Fetched ${allProductsSnapshot.size} total products for manual filtering`);
        
        results = allProductsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...Product.fromFirestore(doc)
          }))
          .filter(product => 
            product.productName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        
        console.log(`Found ${results.length} results after manual filtering`);
      } else {
        results = directSnapshot.docs.map(doc => ({
          id: doc.id,
          ...Product.fromFirestore(doc)
        }));
      }
      
      return results;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
  
  // Get price entries near a location
  async getPriceEntriesNearLocation(latitude, longitude, radiusInKm = 5) {
    try {
      console.log(`Getting price entries near ${latitude}, ${longitude} within ${radiusInKm}km`);
      
      // For simplicity, get all price entries and filter by distance
      // In a production environment, you'd use a geospatial database or extension
      const priceEntriesRef = collection(db, 'price_entries');
      const q = query(
        priceEntriesRef,
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Retrieved ${querySnapshot.size} total price entries`);
      
      // Filter by distance
      const nearbyEntries = [];
      
      for (const doc of querySnapshot.docs) {
        const entry = { id: doc.id, ...PriceEntry.fromFirestore(doc) };
        
        if (!entry.location || !entry.location.latitude || !entry.location.longitude) {
          continue;
        }
        
        const distance = calculateDistance(
          latitude, 
          longitude, 
          entry.location.latitude, 
          entry.location.longitude
        );
        
        if (distance <= radiusInKm) {
          // Add product details to each entry
          if (entry.productId) {
            try {
              const product = await this.getProductById(entry.productId);
              if (product) {
                entry.productName = product.productName;
                entry.productSlug = product.productSlug;
              }
            } catch (err) {
              console.error(`Error fetching product ${entry.productId}:`, err);
            }
          }
          
          nearbyEntries.push(entry);
        }
      }
      
      console.log(`Found ${nearbyEntries.length} entries within ${radiusInKm}km`);
      return nearbyEntries;
    } catch (error) {
      console.error('Error getting nearby price entries:', error);
      throw error;
    }
  }
  
  // Get price entries for a specific product
  async getPriceEntriesForProduct(productId) {
    try {
      console.log(`Getting price entries for product: ${productId}`);
      
      const priceEntriesRef = collection(db, 'price_entries');
      const q = query(
        priceEntriesRef,
        where('productId', '==', productId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} price entries for product ${productId}`);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...PriceEntry.fromFirestore(doc)
      }));
    } catch (error) {
      console.error('Error getting price entries for product:', error);
      throw error;
    }
  }
  
  // Get all price entries (for debugging)
  async getAllPriceEntries() {
    try {
      console.log('Getting all price entries');
      
      const priceEntriesRef = collection(db, 'price_entries');
      const querySnapshot = await getDocs(priceEntriesRef);
      
      const entries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...PriceEntry.fromFirestore(doc)
      }));
      
      console.log(`Found ${entries.length} price entries total`);
      return entries;
    } catch (error) {
      console.error('Error getting all price entries:', error);
      throw error;
    }
  }

  // Get price entries by shop name
  async getPriceEntriesByShop(shopName) {
    try {
      console.log(`Getting price entries for shop: ${shopName}`);
      
      const priceEntriesRef = collection(db, 'price_entries');
      const q = query(
        priceEntriesRef,
        where('shopName', '==', shopName),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} price entries for shop ${shopName}`);
      
      const entries = [];
      
      for (const doc of querySnapshot.docs) {
        const entry = { id: doc.id, ...PriceEntry.fromFirestore(doc) };
        
        // Add product details to each entry
        if (entry.productId) {
          try {
            const product = await this.getProductById(entry.productId);
            if (product) {
              entry.productName = product.productName;
              entry.productSlug = product.productSlug;
            }
          } catch (err) {
            console.error(`Error fetching product ${entry.productId}:`, err);
          }
        }
        
        entries.push(entry);
      }
      
      return entries;
    } catch (error) {
      console.error('Error getting price entries by shop:', error);
      throw error;
    }
  }

  // Set price alert for a product
  async setPriceAlert(productId, targetPrice, userId) {
    try {
      console.log(`Setting price alert for product ${productId} at price ${targetPrice}`);
      
      const alertData = {
        productId,
        targetPrice,
        userId,
        createdAt: Timestamp.now(),
        isActive: true
      };
      
      const alertsRef = collection(db, 'price_alerts');
      const docRef = await addDoc(alertsRef, alertData);
      
      console.log(`Price alert set with ID: ${docRef.id}`);
      return { id: docRef.id, ...alertData };
    } catch (error) {
      console.error('Error setting price alert:', error);
      throw error;
    }
  }

  // Get price alerts for a user
  async getPriceAlertsForUser(userId) {
    try {
      console.log(`Getting price alerts for user: ${userId}`);
      
      const alertsRef = collection(db, 'price_alerts');
      const q = query(
        alertsRef,
        where('userId', '==', userId),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} active price alerts`);
      
      const alerts = [];
      
      for (const doc of querySnapshot.docs) {
        const alert = { id: doc.id, ...doc.data() };
        
        // Add product details
        if (alert.productId) {
          try {
            const product = await this.getProductById(alert.productId);
            if (product) {
              alert.productName = product.productName;
              alert.productSlug = product.productSlug;
            }
          } catch (err) {
            console.error(`Error fetching product ${alert.productId}:`, err);
          }
        }
        
        alerts.push(alert);
      }
      
      return alerts;
    } catch (error) {
      console.error('Error getting price alerts:', error);
      throw error;
    }
  }

  // Delete a price alert
  async deletePriceAlert(alertId) {
    try {
      console.log(`Deleting price alert: ${alertId}`);
      
      await deleteDoc(doc(db, 'price_alerts', alertId));
      
      console.log(`Price alert deleted: ${alertId}`);
      return true;
    } catch (error) {
      console.error('Error deleting price alert:', error);
      throw error;
    }
  }

  // Get price history for a product (for trends)
  async getPriceHistoryForTrends(productId, timeframe = 'all') {
    try {
      console.log(`Getting price history for product ${productId}, timeframe: ${timeframe}`);
      
      // Log current Firestore connection status
      console.log(`Firestore connection state: ${db ? 'connected' : 'not connected'}`);
      
      try {
        const priceEntriesRef = collection(db, 'price_entries');
        let q;
        
        if (timeframe === 'month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          
          q = query(
            priceEntriesRef,
            where('productId', '==', productId),
            where('timestamp', '>=', Timestamp.fromDate(oneMonthAgo)),
            orderBy('timestamp', 'asc')
          );
        } else if (timeframe === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          q = query(
            priceEntriesRef,
            where('productId', '==', productId),
            where('timestamp', '>=', Timestamp.fromDate(oneWeekAgo)),
            orderBy('timestamp', 'asc')
          );
        } else {
          q = query(
            priceEntriesRef,
            where('productId', '==', productId),
            orderBy('timestamp', 'asc')
          );
        }
        
        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.size} price entries for trends`);
        
        if (querySnapshot.empty) {
          console.log("No data found for this product and timeframe");
          return [];
        }
        
        const entries = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...PriceEntry.fromFirestore(doc)
        }));
        
        // Group by days for chart
        const groupedByDay = {};
        
        entries.forEach(entry => {
          const date = entry.timestamp instanceof Date 
            ? entry.timestamp 
            : entry.timestamp.toDate();
          
          const dayKey = date.toISOString().split('T')[0];
          
          if (!groupedByDay[dayKey]) {
            groupedByDay[dayKey] = [];
          }
          
          groupedByDay[dayKey].push(entry);
        });
        
        // Calculate average for each day
        const trendData = Object.keys(groupedByDay).map(day => {
          const dayEntries = groupedByDay[day];
          const sum = dayEntries.reduce((total, entry) => total + entry.price, 0);
          const avg = sum / dayEntries.length;
          
          return {
            date: day,
            price: avg,
            count: dayEntries.length
          };
        });
        
        console.log(`Processed ${trendData.length} days of price data`);
        return trendData;
      } catch (innerError) {
        console.error('Inner error in getPriceHistoryForTrends:', innerError);
        
        // As a fallback, return a small mock dataset
        // This is helpful for development and testing
        return [
          { date: '2023-01-01', price: 100, count: 1 },
          { date: '2023-01-15', price: 95, count: 2 },
          { date: '2023-02-01', price: 105, count: 1 },
          { date: '2023-02-15', price: 110, count: 3 }
        ];
      }
    } catch (error) {
      console.error('Error getting price history for trends:', error);
      throw error;
    }
  }

  // Export user data to JSON
  async exportUserData(userId) {
    try {
      console.log(`Exporting data for user: ${userId}`);
      
      // Get all price entries for this user
      const priceEntriesRef = collection(db, 'price_entries');
      const q = query(
        priceEntriesRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} price entries for export`);
      
      const entries = [];
      
      for (const doc of querySnapshot.docs) {
        const entry = { id: doc.id, ...PriceEntry.fromFirestore(doc) };
        
        // Add product details
        if (entry.productId) {
          try {
            const product = await this.getProductById(entry.productId);
            if (product) {
              entry.productName = product.productName;
              entry.productCategory = product.category;
            }
          } catch (err) {
            console.error(`Error fetching product ${entry.productId}:`, err);
          }
        }
        
        // Format timestamp for export
        if (entry.timestamp) {
          const date = entry.timestamp instanceof Date 
            ? entry.timestamp 
            : entry.timestamp.toDate();
          
          entry.date = date.toISOString();
        }
        
        entries.push(entry);
      }
      
      return entries;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      console.log('Getting current user profile');
      
      // For demonstration purposes, return a mock user
      // In a real app, this would fetch the authenticated user
      return {
        id: 'current-user',
        displayName: 'Current User',
        email: 'user@example.com',
        photoURL: null,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }
  
  // Get user by ID
  async getUserById(userId) {
    try {
      console.log(`Getting user by ID: ${userId}`);
      
      // In a real app, this would fetch the user from Firestore
      // For demonstration, return mock data
      return {
        id: userId,
        displayName: `User ${userId}`,
        email: `user${userId}@example.com`,
        photoURL: null,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }
  
  // Get user contributions (price entries)
  async getUserContributions(userId) {
    try {
      console.log(`Getting contributions for user: ${userId}`);
      
      const priceEntriesRef = collection(db, 'price_entries');
      const q = query(
        priceEntriesRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} contributions`);
      
      const contributions = [];
      
      for (const doc of querySnapshot.docs) {
        const entry = { id: doc.id, ...PriceEntry.fromFirestore(doc) };
        
        // Add product details to each entry
        if (entry.productId) {
          try {
            const product = await this.getProductById(entry.productId);
            if (product) {
              entry.productName = product.productName;
              entry.productSlug = product.productSlug;
            }
          } catch (err) {
            console.error(`Error fetching product ${entry.productId}:`, err);
          }
        }
        
        contributions.push(entry);
      }
      
      return contributions;
    } catch (error) {
      console.error('Error getting user contributions:', error);
      throw error;
    }
  }
  
  // Get user saved products
  async getUserSavedProducts(userId) {
    try {
      console.log(`Getting saved products for user: ${userId}`);
      
      // In a real app, this would fetch from a saved_products collection
      // For demonstration, return mock data
      return [
        {
          id: 'saved1',
          productId: 'product1',
          productName: 'Milk 1L',
          lowestPrice: 75.00,
          highestPrice: 95.00,
          lastUpdated: new Date()
        },
        {
          id: 'saved2',
          productId: 'product2',
          productName: 'Rice 5kg',
          lowestPrice: 350.00,
          highestPrice: 450.00,
          lastUpdated: new Date(Date.now() - 86400000) // Yesterday
        },
        {
          id: 'saved3',
          productId: 'product3',
          productName: 'Sunflower Oil 1L',
          lowestPrice: 120.00,
          highestPrice: 160.00,
          lastUpdated: new Date(Date.now() - 172800000) // 2 days ago
        }
      ];
    } catch (error) {
      console.error('Error getting saved products:', error);
      throw error;
    }
  }

  // Delete a product and optionally its associated price entries
  async deleteProduct(productId, deleteAssociatedEntries = true) {
    try {
      console.log(`Deleting product: ${productId}, with entries: ${deleteAssociatedEntries}`);
      
      // First, get the product to ensure it exists
      const product = await this.getProductById(productId);
      if (!product) {
        console.log(`No product found with ID: ${productId}`);
        return { success: false, message: 'Product not found' };
      }
      
      let entriesCount = 0;
      
      // If requested, delete all associated price entries first
      if (deleteAssociatedEntries) {
        // Get all price entries for this product
        const priceEntriesRef = collection(db, 'price_entries');
        const q = query(priceEntriesRef, where('productId', '==', productId));
        const querySnapshot = await getDocs(q);
        
        entriesCount = querySnapshot.size;
        console.log(`Found ${entriesCount} price entries to delete`);
        
        // Delete each price entry
        const deletePromises = querySnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        );
        
        await Promise.all(deletePromises);
        console.log(`Deleted ${entriesCount} price entries`);
      }
      
      // Now delete the product itself
      await deleteDoc(doc(db, 'products', productId));
      console.log(`Product deleted: ${productId}`);
      
      // Also check for and delete any price alerts related to this product
      const alertsRef = collection(db, 'price_alerts');
      const alertsQuery = query(alertsRef, where('productId', '==', productId));
      const alertsSnapshot = await getDocs(alertsQuery);
      
      let alertsCount = 0;
      if (!alertsSnapshot.empty) {
        alertsCount = alertsSnapshot.size;
        const alertDeletePromises = alertsSnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        );
        
        await Promise.all(alertDeletePromises);
        console.log(`Deleted ${alertsCount} price alerts for the product`);
      }
      
      return { 
        success: true, 
        message: `Product "${product.productName}" deleted successfully`,
        deletedEntries: entriesCount,
        deletedAlerts: alertsCount
      };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, message: `Error: ${error.message}` };
    }
  }
}

const firebaseService = new FirebaseService();
export default firebaseService; 