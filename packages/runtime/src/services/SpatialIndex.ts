import { Bounds } from '@desktop-interop/sdk';

/**
 * Spatial Index Entry
 */
interface SpatialEntry {
  id: string;
  bounds: Bounds;
  gridCells: Set<string>;
}

/**
 * Spatial Index - efficient spatial queries using grid-based indexing
 */
export class SpatialIndex {
  private entries: Map<string, SpatialEntry> = new Map();
  private grid: Map<string, Set<string>> = new Map();
  private cellSize: number;
  
  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
  }
  
  /**
   * Insert an entry into the spatial index
   */
  insert(id: string, bounds: Bounds): void {
    // Remove existing entry if present
    this.remove(id);
    
    // Calculate grid cells this bounds occupies
    const gridCells = this.getGridCells(bounds);
    
    // Create entry
    const entry: SpatialEntry = {
      id,
      bounds,
      gridCells
    };
    
    this.entries.set(id, entry);
    
    // Add to grid cells
    gridCells.forEach(cellKey => {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, new Set());
      }
      this.grid.get(cellKey)!.add(id);
    });
  }
  
  /**
   * Remove an entry from the spatial index
   */
  remove(id: string): void {
    const entry = this.entries.get(id);
    
    if (!entry) {
      return;
    }
    
    // Remove from grid cells
    entry.gridCells.forEach(cellKey => {
      const cell = this.grid.get(cellKey);
      if (cell) {
        cell.delete(id);
        if (cell.size === 0) {
          this.grid.delete(cellKey);
        }
      }
    });
    
    // Remove entry
    this.entries.delete(id);
  }
  
  /**
   * Update an entry's bounds
   */
  update(id: string, bounds: Bounds): void {
    this.insert(id, bounds);
  }
  
  /**
   * Query entries within a certain distance of given bounds
   */
  query(bounds: Bounds, maxDistance: number): string[] {
    // Expand bounds by maxDistance
    const expandedBounds: Bounds = {
      x: bounds.x - maxDistance,
      y: bounds.y - maxDistance,
      width: bounds.width + (maxDistance * 2),
      height: bounds.height + (maxDistance * 2),
      left: bounds.left - maxDistance,
      top: bounds.top - maxDistance,
      right: bounds.right + maxDistance,
      bottom: bounds.bottom + maxDistance
    };
    
    // Get grid cells for expanded bounds
    const gridCells = this.getGridCells(expandedBounds);
    
    // Collect candidate IDs from grid cells
    const candidateIds = new Set<string>();
    gridCells.forEach(cellKey => {
      const cell = this.grid.get(cellKey);
      if (cell) {
        cell.forEach(id => candidateIds.add(id));
      }
    });
    
    // Filter candidates by actual distance
    const results: string[] = [];
    
    candidateIds.forEach(id => {
      const entry = this.entries.get(id);
      if (entry) {
        const distance = this.calculateDistance(bounds, entry.bounds);
        if (distance <= maxDistance) {
          results.push(id);
        }
      }
    });
    
    return results;
  }
  
  /**
   * Get all entries
   */
  getAll(): Map<string, Bounds> {
    const result = new Map<string, Bounds>();
    this.entries.forEach((entry, id) => {
      result.set(id, entry.bounds);
    });
    return result;
  }
  
  /**
   * Get bounds for a specific entry
   */
  getBounds(id: string): Bounds | null {
    const entry = this.entries.get(id);
    return entry ? entry.bounds : null;
  }
  
  /**
   * Clear all entries
   */
  clear(): void {
    this.entries.clear();
    this.grid.clear();
  }
  
  /**
   * Get number of entries
   */
  size(): number {
    return this.entries.size;
  }
  
  /**
   * Calculate grid cells that bounds occupies
   */
  private getGridCells(bounds: Bounds): Set<string> {
    const cells = new Set<string>();
    
    const minCellX = Math.floor(bounds.left / this.cellSize);
    const maxCellX = Math.floor(bounds.right / this.cellSize);
    const minCellY = Math.floor(bounds.top / this.cellSize);
    const maxCellY = Math.floor(bounds.bottom / this.cellSize);
    
    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        cells.add(`${x},${y}`);
      }
    }
    
    return cells;
  }
  
  /**
   * Calculate minimum distance between two bounds
   */
  private calculateDistance(bounds1: Bounds, bounds2: Bounds): number {
    // If bounds overlap, distance is 0
    if (this.boundsOverlap(bounds1, bounds2)) {
      return 0;
    }
    
    // Calculate distance between closest edges
    let dx = 0;
    let dy = 0;
    
    if (bounds1.right < bounds2.left) {
      dx = bounds2.left - bounds1.right;
    } else if (bounds2.right < bounds1.left) {
      dx = bounds1.left - bounds2.right;
    }
    
    if (bounds1.bottom < bounds2.top) {
      dy = bounds2.top - bounds1.bottom;
    } else if (bounds2.bottom < bounds1.top) {
      dy = bounds1.top - bounds2.bottom;
    }
    
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Check if two bounds overlap
   */
  private boundsOverlap(bounds1: Bounds, bounds2: Bounds): boolean {
    return !(bounds1.right < bounds2.left ||
             bounds2.right < bounds1.left ||
             bounds1.bottom < bounds2.top ||
             bounds2.bottom < bounds1.top);
  }
}
