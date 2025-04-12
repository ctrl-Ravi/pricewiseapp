/**
 * PriceEntry model class
 */
class PriceEntry {
  constructor(
    productId,
    price,
    shopName = null,
    location = { latitude: 0, longitude: 0 },
    locationName = null,
    timestamp = new Date(),
    userId = null,
    photoURL = null,
    isPublic = true,
    quantity = 1,
    unit = 'pc',
    unitPrice = null
  ) {
    this.productId = productId;
    this.price = price;
    this.shopName = shopName;
    this.location = location;
    this.locationName = locationName;
    this.timestamp = timestamp;
    this.userId = userId;
    this.photoURL = photoURL;
    this.isPublic = isPublic;
    this.quantity = quantity;
    this.unit = unit;
    this.unitPrice = unitPrice || price / quantity;
  }

  // Convert to Firestore document
  toFirestore() {
    return {
      productId: this.productId,
      price: this.price,
      shopName: this.shopName,
      location: this.location,
      locationName: this.locationName,
      timestamp: this.timestamp,
      userId: this.userId,
      photoURL: this.photoURL,
      isPublic: this.isPublic,
      quantity: this.quantity,
      unit: this.unit,
      unitPrice: this.unitPrice,
    };
  }

  // Create from Firestore document
  static fromFirestore(doc) {
    const data = doc.data();
    return new PriceEntry(
      data.productId,
      data.price,
      data.shopName,
      data.location,
      data.locationName,
      data.timestamp?.toDate() || new Date(),
      data.userId,
      data.photoURL,
      data.isPublic !== undefined ? data.isPublic : true, // Default to true for backward compatibility
      data.quantity || 1,
      data.unit || 'pc',
      data.unitPrice || (data.price / (data.quantity || 1))
    );
  }
}

export default PriceEntry; 