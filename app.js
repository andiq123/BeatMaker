class DrumKit {
  constructor() {
    this.initializeElements();
    this.initializeAudio();
    this.initializeState();
    this.bindEvents();
  }

  initializeElements() {
    this.pads = document.querySelectorAll(".pad");
    this.playBtn = document.querySelector(".play");
    this.selects = document.querySelectorAll("select");
    this.muteBtns = document.querySelectorAll(".mute");
    this.tempoSlider = document.querySelector(".tempo-slider");
    this.tempoText = document.querySelector(".tempo-nr");
    this.presetBtns = document.querySelectorAll(".preset-btn");
  }

  async initializeAudio() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Initialize audio buffers
      this.audioBuffers = {
        kick: null,
        snare: null,
        hihat: null
      };

      // Initialize audio elements
      this.audioElements = {
        kick: document.querySelector(".kick-sound"),
        snare: document.querySelector(".snare-sound"),
        hihat: document.querySelector(".hihat-sound")
      };

      // Initialize gain nodes for volume control
      this.gainNodes = {
        kick: this.audioContext.createGain(),
        snare: this.audioContext.createGain(),
        hihat: this.audioContext.createGain()
      };

      // Connect gain nodes to audio context destination
      Object.values(this.gainNodes).forEach(node => {
        node.connect(this.audioContext.destination);
      });

      // Preload initial sounds
      await this.preloadAudio();
    } catch (error) {
      console.error('Error initializing audio:', error);
      this.showError('Failed to initialize audio. Please try refreshing the page.');
    }
  }

  initializeState() {
    this.state = {
      index: 0,
      bpm: 150,
      isPlaying: null,
      currentSounds: {
        kick: "./allSounds/kick-classic.wav",
        snare: "./allSounds/snare-acoustic01.wav",
        hihat: "./allSounds/hihat-acoustic01.wav"
      },
      muted: {
        kick: false,
        snare: false,
        hihat: false
      }
    };

    // Sound configuration
    this.soundConfig = {
      kick: {
        category: 'Kick',
        sounds: [
          { name: 'Classic', file: 'kick-classic.wav', type: 'acoustic' },
          { name: '808', file: 'kick-808.wav', type: 'electronic' },
          { name: 'Heavy', file: 'kick-heavy.wav', type: 'acoustic' },
          { name: 'Deep', file: 'kick-deep.wav', type: 'electronic' },
          { name: 'Acoustic', file: 'kick-acoustic01.wav', type: 'acoustic' },
          { name: 'Electro', file: 'kick-electro01.wav', type: 'electronic' },
          { name: 'Big', file: 'kick-big.wav', type: 'acoustic' },
          { name: 'Tight', file: 'kick-tight.wav', type: 'electronic' }
        ]
      },
      snare: {
        category: 'Snare',
        sounds: [
          { name: 'Acoustic', file: 'snare-acoustic01.wav', type: 'acoustic' },
          { name: '808', file: 'snare-808.wav', type: 'electronic' },
          { name: 'Vinyl', file: 'snare-vinyl02.wav', type: 'lo-fi' },
          { name: 'Big', file: 'snare-big.wav', type: 'acoustic' },
          { name: 'Analog', file: 'snare-analog.wav', type: 'electronic' },
          { name: 'Lo-Fi', file: 'snare-lofi01.wav', type: 'lo-fi' },
          { name: 'Punch', file: 'snare-punch.wav', type: 'acoustic' },
          { name: 'Electro', file: 'snare-electro.wav', type: 'electronic' }
        ]
      },
      hihat: {
        category: 'Hi-Hat',
        sounds: [
          { name: 'Acoustic', file: 'hihat-acoustic01.wav', type: 'acoustic' },
          { name: '808', file: 'hihat-808.wav', type: 'electronic' },
          { name: 'Analog', file: 'hihat-analog.wav', type: 'electronic' },
          { name: 'Digital', file: 'hihat-digital.wav', type: 'electronic' },
          { name: 'Plain', file: 'hihat-plain.wav', type: 'acoustic' },
          { name: 'Ring', file: 'hihat-ring.wav', type: 'acoustic' }
        ]
      },
      tom: {
        category: 'Tom',
        sounds: [
          { name: 'Acoustic', file: 'tom-acoustic01.wav', type: 'acoustic' },
          { name: '808', file: 'tom-808.wav', type: 'electronic' },
          { name: 'Analog', file: 'tom-analog.wav', type: 'electronic' },
          { name: 'Short', file: 'tom-short.wav', type: 'acoustic' }
        ]
      },
      clap: {
        category: 'Clap',
        sounds: [
          { name: '808', file: 'clap-808.wav', type: 'electronic' },
          { name: 'Analog', file: 'clap-analog.wav', type: 'electronic' },
          { name: 'Fat', file: 'clap-fat.wav', type: 'acoustic' },
          { name: 'Slapper', file: 'clap-slapper.wav', type: 'acoustic' }
        ]
      },
      crash: {
        category: 'Crash',
        sounds: [
          { name: 'Acoustic', file: 'crash-acoustic.wav', type: 'acoustic' },
          { name: '808', file: 'crash-808.wav', type: 'electronic' },
          { name: 'Tape', file: 'crash-tape.wav', type: 'lo-fi' }
        ]
      }
    };

    // Initialize sound presets
    this.presets = {
      acoustic: {
        kick: 'kick-acoustic01.wav',
        snare: 'snare-acoustic01.wav',
        hihat: 'hihat-acoustic01.wav'
      },
      electronic: {
        kick: 'kick-808.wav',
        snare: 'snare-808.wav',
        hihat: 'hihat-808.wav'
      },
      loFi: {
        kick: 'kick-vinyl01.wav',
        snare: 'snare-lofi01.wav',
        hihat: 'hihat-analog.wav'
      }
    };
  }

  async preloadAudio() {
    try {
      const audioFiles = Object.entries(this.state.currentSounds);
      
      await Promise.all(audioFiles.map(async ([type, url]) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${type} sound`);
        
        const arrayBuffer = await response.arrayBuffer();
        this.audioBuffers[type] = await this.audioContext.decodeAudioData(arrayBuffer);
      }));
    } catch (error) {
      console.error('Error preloading audio:', error);
      this.showError('Failed to load some audio files. Please check your connection and refresh.');
    }
  }

  bindEvents() {
    // Pad events
    this.pads.forEach(pad => {
      pad.addEventListener("click", this.activePad.bind(pad));
      pad.addEventListener("animationend", () => pad.style.animation = "");
    });

    // Play button
    this.playBtn.addEventListener("click", () => {
      this.togglePlay();
    });

    // Sound selection
    this.selects.forEach(select => {
      select.addEventListener("change", (e) => this.changeSound(e));
    });

    // Mute buttons
    this.muteBtns.forEach(btn => {
      btn.addEventListener("click", (e) => this.toggleMute(e));
    });

    // Tempo control
    this.tempoSlider.addEventListener("input", (e) => this.changeTempo(e));
    this.tempoSlider.addEventListener("change", () => this.updateTempo());

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeyPress(e));

    // Preset buttons
    this.presetBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const preset = e.target.closest('.preset-btn').dataset.preset;
        this.loadPreset(preset);
      });
    });
  }

  handleKeyPress(e) {
    const keyMap = {
      ' ': () => this.togglePlay(),
      'ArrowUp': () => this.increaseTempo(),
      'ArrowDown': () => this.decreaseTempo(),
      'm': () => this.toggleMute()
    };

    if (keyMap[e.key]) {
      e.preventDefault();
      keyMap[e.key]();
    }
  }

  async togglePlay() {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    this.updateBtn();
    this.start();
  }

  increaseTempo() {
    const newTempo = Math.min(parseInt(this.tempoSlider.value) + 5, 300);
    this.tempoSlider.value = newTempo;
    this.changeTempo({ target: this.tempoSlider });
  }

  decreaseTempo() {
    const newTempo = Math.max(parseInt(this.tempoSlider.value) - 5, 20);
    this.tempoSlider.value = newTempo;
    this.changeTempo({ target: this.tempoSlider });
  }

  toggleMute(e) {
    const trackIndex = e.target.getAttribute("data-track");
    const trackType = ['kick', 'snare', 'hihat'][trackIndex];
    
    this.state.muted[trackType] = !this.state.muted[trackType];
    e.target.classList.toggle("active");
    
    this.gainNodes[trackType].gain.value = this.state.muted[trackType] ? 0 : 1;
  }

  activePad() {
    this.classList.toggle("active");
  }

  async repeat() {
    const step = this.state.index % 8;
    const activeBars = document.querySelectorAll(`.b${step}`);
    
    activeBars.forEach(bar => {
      bar.style.animation = `play 0.2s ease-in-out`;
      
      if (bar.classList.contains("active")) {
        const soundType = this.getSoundTypeForPad(bar);
        if (soundType && !this.state.muted[soundType]) {
          this.playSound(soundType);
        }
      }
    });
    
    this.state.index++;
  }

  getSoundTypeForPad(pad) {
    if (pad.classList.contains("kick-pad")) return "kick";
    if (pad.classList.contains("snare-pad")) return "snare";
    if (pad.classList.contains("hihat-pad")) return "hihat";
    return null;
  }

  async playSound(type) {
    try {
      if (!this.audioBuffers[type]) return;

      const source = this.audioContext.createBufferSource();
      source.buffer = this.audioBuffers[type];
      source.connect(this.gainNodes[type]);
      source.start(0);
    } catch (error) {
      console.error(`Error playing ${type} sound:`, error);
    }
  }

  start() {
    const interval = (60 / this.state.bpm) * 1000;
    
    if (!this.state.isPlaying) {
      this.state.isPlaying = setInterval(() => this.repeat(), interval);
    } else {
      clearInterval(this.state.isPlaying);
      this.state.isPlaying = null;
    }
  }

  updateBtn() {
    const isActive = !this.state.isPlaying;
    this.playBtn.innerHTML = isActive ? 
      '<i class="fas fa-stop"></i><span>Stop</span>' : 
      '<i class="fas fa-play"></i><span>Play</span>';
    this.playBtn.classList.toggle("active", isActive);
  }

  async changeSound(e) {
    const { name, value } = e.target;
    const soundType = name.split('-')[0];
    
    try {
      // Stop any currently playing sounds
      if (this.audioContext.state === 'running') {
        await this.audioContext.suspend();
      }

      const response = await fetch(value);
      if (!response.ok) throw new Error(`Failed to load ${soundType} sound`);
      
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffers[soundType] = await this.audioContext.decodeAudioData(arrayBuffer);
      this.state.currentSounds[soundType] = value;

      // Resume audio context if it was playing
      if (this.state.isPlaying) {
        await this.audioContext.resume();
      }

      // Update the audio element source
      const audioElement = this.audioElements[soundType];
      if (audioElement) {
        audioElement.src = value;
        await audioElement.load();
      }
    } catch (error) {
      console.error(`Error changing ${soundType} sound:`, error);
      this.showError(`Failed to load ${soundType} sound. Please try another one.`);
      
      // Reset the select to the previous value
      e.target.value = this.state.currentSounds[soundType];
    }
  }

  changeTempo(e) {
    this.state.bpm = e.target.value;
    this.tempoText.textContent = this.state.bpm;
  }

  updateTempo() {
    if (this.state.isPlaying) {
      clearInterval(this.state.isPlaying);
      this.start();
    }
  }

  showError(message) {
    // You could implement a proper error notification system here
    console.error(message);
    alert(message);
  }

  // New methods for sound management
  getSoundOptions(type) {
    return this.soundConfig[type]?.sounds || [];
  }

  getSoundByType(type, soundType) {
    return this.soundConfig[type]?.sounds.find(s => s.type === soundType)?.file;
  }

  async loadPreset(presetName) {
    if (!this.presets[presetName]) {
      console.error(`Preset ${presetName} not found`);
      return;
    }

    try {
      // Stop any currently playing sounds
      if (this.audioContext.state === 'running') {
        await this.audioContext.suspend();
      }

      const preset = this.presets[presetName];
      const loadPromises = [];

      for (const [type, file] of Object.entries(preset)) {
        const fullPath = `./allSounds/${file}`;
        loadPromises.push(
          fetch(fullPath)
            .then(response => {
              if (!response.ok) throw new Error(`Failed to load ${type} sound`);
              return response.arrayBuffer();
            })
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(buffer => {
              this.audioBuffers[type] = buffer;
              this.state.currentSounds[type] = fullPath;
              
              // Update select element
              const select = document.querySelector(`#${type}-select`);
              if (select) {
                select.value = fullPath;
              }

              // Update audio element
              const audioElement = this.audioElements[type];
              if (audioElement) {
                audioElement.src = fullPath;
                return audioElement.load();
              }
            })
        );
      }

      await Promise.all(loadPromises);

      // Resume audio context if it was playing
      if (this.state.isPlaying) {
        await this.audioContext.resume();
      }

      // Visual feedback for preset selection
      this.presetBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === presetName);
      });

    } catch (error) {
      console.error('Error loading preset:', error);
      this.showError('Failed to load preset. Please try again.');
    }
  }

  // Helper method to get sound type (acoustic, electronic, lo-fi)
  getSoundType(file) {
    const sound = Object.values(this.soundConfig)
      .flatMap(category => category.sounds)
      .find(s => s.file === file);
    return sound?.type || 'unknown';
  }
}

// Initialize the drum kit when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DrumKit();
});
