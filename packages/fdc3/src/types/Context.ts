/**
 * FDC3 Context base interface
 */
export interface Context {
  /** Context type identifier */
  type: string;
  /** Optional name for the context */
  name?: string;
  /** Optional ID object */
  id?: Record<string, string>;
  /** Additional context-specific fields */
  [key: string]: any;
}

/**
 * FDC3 Instrument context
 */
export interface InstrumentContext extends Context {
  type: 'fdc3.instrument';
  id: {
    ticker?: string;
    ISIN?: string;
    CUSIP?: string;
    SEDOL?: string;
    RIC?: string;
    FIGI?: string;
  };
  name?: string;
}

/**
 * FDC3 Contact context
 */
export interface ContactContext extends Context {
  type: 'fdc3.contact';
  id: {
    email?: string;
    phone?: string;
  };
  name?: string;
}

/**
 * FDC3 Organization context
 */
export interface OrganizationContext extends Context {
  type: 'fdc3.organization';
  id: {
    LEI?: string;
    PERMID?: string;
  };
  name?: string;
}

/**
 * Context handler function
 */
export type ContextHandler = (context: Context) => void | Promise<void>;
