/**
 * Product model class
 */
class Product {
  constructor(productName, productSlug, category = null) {
    this.productName = productName;
    this.productSlug = productSlug;
    this.category = category;
  }

  // Convert to Firestore document
  toFirestore() {
    return {
      productName: this.productName,
      productSlug: this.productSlug,
      category: this.category,
    };
  }

  // Create from Firestore document
  static fromFirestore(doc) {
    const data = doc.data();
    return new Product(
      data.productName,
      data.productSlug,
      data.category
    );
  }
}

export default Product; 