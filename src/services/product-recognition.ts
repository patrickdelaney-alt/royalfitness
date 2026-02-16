/**
 * Product Recognition Service (MVP: manual entry with stub interface)
 *
 * Phase 2: Swap StubProductRecognizer with a real implementation
 * using vision APIs (Google Vision, AWS Rekognition) or ShopMy-style linking.
 */

export interface RecognizedProduct {
  name: string;
  brand: string | null;
  category: string | null;
  confidence: number; // 0-1
  link: string | null;
}

export interface ProductRecognizer {
  /**
   * Analyze an image and attempt to identify products.
   * @param imageUrl - URL or path to the uploaded image
   * @returns Array of recognized products (may be empty)
   */
  recognize(imageUrl: string): Promise<RecognizedProduct[]>;
}

/**
 * Stub implementation for MVP.
 * Returns empty results — user fills in product details manually.
 * The UI shows the uploaded image alongside manual entry fields.
 */
export class StubProductRecognizer implements ProductRecognizer {
  async recognize(_imageUrl: string): Promise<RecognizedProduct[]> {
    // MVP: No actual recognition. User enters details manually.
    // Phase 2: Call a vision API here.
    return [];
  }
}

// Singleton — swap implementation in Phase 2
export const productRecognizer: ProductRecognizer =
  new StubProductRecognizer();
