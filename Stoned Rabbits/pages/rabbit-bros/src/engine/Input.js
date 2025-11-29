export class Input {
    constructor() {
        this.keys = {
            UP: false,
            DOWN: false,
            LEFT: false,
            RIGHT: false,
            A: false, // Jump (Z)
            B: false, // Run/Fire (X)
            START: false, // Enter
            SELECT: false // Shift
        };

        // Track previous frame state for "Just Pressed" detection
        this.prevKeys = { ...this.keys };

        this.map = {
            'ArrowUp': 'UP',
            'w': 'UP',
            'ArrowDown': 'DOWN',
            's': 'DOWN',
            'ArrowLeft': 'LEFT',
            'a': 'LEFT',
            'ArrowRight': 'RIGHT',
            'd': 'RIGHT',
            'z': 'A',
            ' ': 'A', // Space is also Jump
            'x': 'B',
            'Enter': 'START',
            'Shift': 'SELECT',
            // Debug Keys
            'i': 'I',
            'j': 'J',
            'k': 'K',
            'l': 'L'
        };

        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(e) {
        const action = this.map[e.key];
        if (action) {
            this.keys[action] = true;
            // Prevent default browser behavior (scrolling, button clicking)
            if (e.key === ' ' || e.key.startsWith('Arrow')) {
                e.preventDefault();
            }
        }
    }

    onKeyUp(e) {
        const action = this.map[e.key];
        if (action) {
            this.keys[action] = false;
        }
    }

    // Call this at the start of every frame
    update() {
        this.prevKeys = { ...this.keys };
    }

    // Check if a button is currently held down
    isPressed(action) {
        return this.keys[action];
    }

    // Check if a button was pressed THIS frame (rising edge)
    isJustPressed(action) {
        return this.keys[action] && !this.prevKeys[action];
    }
    // Allow external control (e.g. Touch Buttons)
    setButton(action, state) {
        if (this.keys.hasOwnProperty(action)) {
            this.keys[action] = state;
        }
    }
}
