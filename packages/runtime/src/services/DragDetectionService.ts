import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { Point, Size } from '@desktop-interop/sdk';

/**
 * Drag state for a window
 */
interface DragState {
    windowId: string;
    isDragging: boolean;
    startPosition: Point;
    startBounds: { x: number; y: number; width: number; height: number };
    lastPosition: Point;
    isProgrammatic: boolean;
}

/**
 * Drag Detection Service
 * Automatically detects when users drag windows and coordinates with window management features
 */
export class DragDetectionService extends EventEmitter {
    private dragStates: Map<string, DragState> = new Map();
    private dragThreshold = 5; // pixels to move before considering it a drag
    private updateInterval: NodeJS.Timeout | null = null;
    private readonly UPDATE_FPS = 60;

    constructor() {
        super();
    }

    /**
     * Initialize the service
     */
    async initialize(): Promise<void> {
        // Start update loop for smooth drag tracking
        this.updateInterval = setInterval(() => {
            this.updateDragStates();
        }, 1000 / this.UPDATE_FPS);
    }

    /**
     * Shutdown the service
     */
    async shutdown(): Promise<void> {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.dragStates.clear();
    }

    /**
     * Register a window for drag detection
     */
    registerWindow(windowId: string, browserWindow: BrowserWindow): void {
        // Listen for window move start
        browserWindow.on('will-move', () => {
            this.handleWillMove(windowId, browserWindow);
        });

        // Listen for window move
        browserWindow.on('moved', () => {
            this.handleMoved(windowId, browserWindow);
        });

        // Listen for mouse up (drag end) - using move-end as proxy
        let moveTimeout: NodeJS.Timeout | null = null;
        browserWindow.on('moved', () => {
            // Clear existing timeout
            if (moveTimeout) {
                clearTimeout(moveTimeout);
            }

            // Set new timeout - if no move for 100ms, consider drag ended
            moveTimeout = setTimeout(() => {
                this.handleDragEnd(windowId);
                moveTimeout = null;
            }, 100);
        });

        // Clean up on close
        browserWindow.on('closed', () => {
            this.unregisterWindow(windowId);
        });
    }

    /**
     * Unregister a window
     */
    unregisterWindow(windowId: string): void {
        const dragState = this.dragStates.get(windowId);
        if (dragState && dragState.isDragging) {
            this.emit('drag-end', { windowId });
        }
        this.dragStates.delete(windowId);
    }

    /**
     * Handle will-move event
     */
    private handleWillMove(windowId: string, browserWindow: BrowserWindow): void {
        const bounds = browserWindow.getBounds();
        const cursorPosition = require('electron').screen.getCursorScreenPoint();

        // Check if this is a programmatic move by comparing with last known position
        const existingState = this.dragStates.get(windowId);
        const isProgrammatic = existingState?.isProgrammatic || false;

        // Initialize drag state
        const dragState: DragState = {
            windowId,
            isDragging: false,
            startPosition: cursorPosition,
            startBounds: bounds,
            lastPosition: cursorPosition,
            isProgrammatic
        };

        this.dragStates.set(windowId, dragState);
    }

    /**
     * Handle moved event
     */
    private handleMoved(windowId: string, browserWindow: BrowserWindow): void {
        const dragState = this.dragStates.get(windowId);
        if (!dragState) {
            return;
        }

        const cursorPosition = require('electron').screen.getCursorScreenPoint();
        const bounds = browserWindow.getBounds();

        // Calculate distance moved
        const distance = Math.sqrt(
            Math.pow(cursorPosition.x - dragState.startPosition.x, 2) +
            Math.pow(cursorPosition.y - dragState.startPosition.y, 2)
        );

        // Start drag if threshold exceeded and not programmatic
        if (!dragState.isDragging && distance > this.dragThreshold && !dragState.isProgrammatic) {
            dragState.isDragging = true;
            this.emit('drag-start', {
                windowId,
                startPosition: dragState.startPosition,
                startBounds: dragState.startBounds
            });
        }

        // Update position
        dragState.lastPosition = cursorPosition;

        // Emit drag update if dragging
        if (dragState.isDragging) {
            this.emit('drag-update', {
                windowId,
                position: cursorPosition,
                size: { width: bounds.width, height: bounds.height },
                bounds
            });
        }
    }

    /**
     * Handle drag end
     */
    private handleDragEnd(windowId: string): void {
        const dragState = this.dragStates.get(windowId);
        if (!dragState || !dragState.isDragging) {
            return;
        }

        this.emit('drag-end', {
            windowId,
            endPosition: dragState.lastPosition
        });

        // Reset drag state
        dragState.isDragging = false;
    }

    /**
     * Update drag states (called on interval)
     */
    private updateDragStates(): void {
        const cursorPosition = require('electron').screen.getCursorScreenPoint();

        for (const [windowId, dragState] of this.dragStates.entries()) {
            if (dragState.isDragging) {
                // Check if cursor position changed
                if (
                    cursorPosition.x !== dragState.lastPosition.x ||
                    cursorPosition.y !== dragState.lastPosition.y
                ) {
                    dragState.lastPosition = cursorPosition;

                    this.emit('drag-update', {
                        windowId,
                        position: cursorPosition,
                        size: { width: 0, height: 0 } // Will be updated by window manager
                    });
                }
            }
        }
    }

    /**
     * Mark a window move as programmatic (to avoid triggering drag detection)
     */
    markProgrammaticMove(windowId: string): void {
        const dragState = this.dragStates.get(windowId);
        if (dragState) {
            dragState.isProgrammatic = true;
        } else {
            this.dragStates.set(windowId, {
                windowId,
                isDragging: false,
                startPosition: { x: 0, y: 0 },
                startBounds: { x: 0, y: 0, width: 0, height: 0 },
                lastPosition: { x: 0, y: 0 },
                isProgrammatic: true
            });
        }

        // Reset after a short delay
        setTimeout(() => {
            const state = this.dragStates.get(windowId);
            if (state) {
                state.isProgrammatic = false;
            }
        }, 100);
    }

    /**
     * Check if a window is currently being dragged
     */
    isDragging(windowId: string): boolean {
        const dragState = this.dragStates.get(windowId);
        return dragState?.isDragging || false;
    }
}
