# Socket-connected timeline-based music sampler

This project allows multiple users to create and manage music samples simultaneously through socket connections.

<img width="962" alt="ctp431" src="https://github.com/user-attachments/assets/0adbf65c-ffe1-42d0-b919-ff4c8dd2c69e" />

[https://youtu.be/-sdnVOFgNCg](https://youtu.be/-sdnVOFgNCg)

**Disclaimer: ALL USED SAMPLES ARE DELETED WHEN REQUESTED. THIS REPOSITORY IS FOR JUST SERVING CODE ONLINE FOR MY PROJECT SUBMISSION. WILL BE DELETED BEFORE JANUARY.**

[Demo Link](https://ctp431.litmify.com)

## Features

- Add and remove tracks
- Adjust beat grid size
- Adjust BPM (Beats Per Minute)
- Play, pause, and stop functionality
- Real-time state synchronization via sockets

## Installation and Running

### Requirements

- Node.js
- npm or yarn

### Installation

1. Clone the repository:

```sh
git clone https://github.com/your-username/multi-sampler.git
cd multi-sampler
```

2. Install dependencies:

```sh
npm install
# or
yarn install
```

3. Start the server:

```
npm run dev
# or
yarn dev
```

Open your browser and navigate to http://localhost:4000.

Usage

- Click the "Connect" button to connect to the server.
- Click the "Add Track" button to add a new track.
- Click on the beats within each track to toggle them on or off.
- Click the "Play" button to start playback.
- Click the "Pause" button to pause playback.
- Click the "Stop" button to stop playback.
- Click the "Reset State" button to reset the state.
