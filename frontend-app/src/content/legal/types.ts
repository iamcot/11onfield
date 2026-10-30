/** A legal document as data, so each language is one file and the markup lives in LegalPage. */
export type LegalDoc = {
  title: string;
  /** paragraphs before the first section */
  intro?: string[];
  sections: {
    title: string;
    /** paragraphs before the list */
    lead?: string[];
    /** [bold label, text] */
    items?: [string, string][];
    /** paragraphs after the list */
    notes?: string[];
  }[];
  /** line above the email / hotline */
  contact: string;
};
