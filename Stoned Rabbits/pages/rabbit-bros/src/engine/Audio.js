export class AudioController {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0; // Start Muted
        this.masterGain.connect(this.ctx.destination);

        this.isPlaying = false;
        this.currentNote = 0;
        this.nextNoteTime = 0;
        this.tempo = 150;
        this.lookahead = 25.0;
        this.scheduleAheadTime = 0.1;

        // Pirate Theme (NES Style)
        // Format: [Note, Duration (16th notes)]
        // 0 = Rest
        this.melody = [
            // Intro
            ['G4', 4], ['G4', 4], ['G4', 4], ['Eb4', 2], ['Bb4', 2],
            ['G4', 4], ['Eb4', 2], ['Bb4', 2], ['G4', 8],

            // Theme A
            ['D5', 4], ['D5', 4], ['D5', 4], ['Eb5', 2], ['Bb4', 2],
            ['Gb4', 4], ['Eb4', 2], ['Bb4', 2], ['G4', 8],

            // Theme B (Pirate Jig)
            ['C4', 2], ['Eb4', 2], ['G4', 2], ['C5', 4], ['G4', 2], ['Eb4', 2], ['C4', 2],
            ['G3', 2], ['B3', 2], ['D4', 2], ['F4', 4], ['D4', 2], ['B3', 2], ['G3', 2],

            // Loop back
            ['C4', 4], ['G3', 4], ['C4', 8]
        ];

        this.frequencies = {
            'G3': 196.00, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'Eb4': 311.13, 'F4': 349.23, 'Gb4': 369.99, 'G4': 392.00, 'Bb4': 466.16,
            'C5': 523.25, 'D5': 587.33, 'Eb5': 622.25
        };
        this.isMuted = true; // Default Muted
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.masterGain.gain.value = 0;
        } else {
            this.masterGain.gain.value = 0.3;
        }
        return this.isMuted;
    }

    async start() {
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.nextNoteTime = this.ctx.currentTime;
            this.scheduler();
        }
    }

    scheduler() {
        if (!this.isPlaying) return;

        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.playNote(this.melody[this.currentNote]);
            this.nextNote();
        }

        // Check again soon
        setTimeout(() => this.scheduler(), this.lookahead);
    }

    nextNote() {
        const note = this.melody[this.currentNote];
        const duration = note[1] * (60 / this.tempo / 4); // 16th note duration
        this.nextNoteTime += duration;

        this.currentNote++;
        if (this.currentNote >= this.melody.length) {
            this.currentNote = 0; // Loop
        }
    }

    playNote(noteData) {
        const [noteName, length] = noteData;
        if (!noteName || noteName === 0) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square'; // NES classic sound
        osc.frequency.value = this.frequencies[noteName] || 0;

        osc.connect(gain);
        gain.connect(this.masterGain);

        const duration = length * (60 / this.tempo / 4);

        // Envelope (staccato for that 8-bit feel)
        gain.gain.setValueAtTime(0.1, this.nextNoteTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.nextNoteTime + duration - 0.05);

        osc.start(this.nextNoteTime);
        osc.stop(this.nextNoteTime + duration);
    }

    playJump() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playBump() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
}
