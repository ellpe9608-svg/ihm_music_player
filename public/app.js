const statusText = document.querySelector('#status');
const trackList = document.querySelector('#track-list');
const nowPlaying = document.querySelector('#now-playing');
const audioPlayer = document.querySelector('#audio-player');
const uploadInput = document.querySelector('#track-upload');
const uploadButton = document.querySelector('#upload-button');

statusText.textContent = 'JavaScript har hittat HTML-elementen.';

console.log('Klienten är igång');

let tracks = [];

async function loadTracks() {
  statusText.textContent = 'Hämtar låtar från servern...';

  const response = await fetch('/api/tracks');
  tracks = await response.json();

  console.log('Svar från GET /api/tracks:', tracks);
  renderTracks();

  const lastTrackId = localStorage.getItem('lastTrackId');
  const lastTrack = tracks.find(function (track) {
    return track.id === lastTrackId;
  });

  if (lastTrack) {
    nowPlaying.textContent = `Senast spelad: ${lastTrack.title}`;
  }

  statusText.textContent = `${tracks.length} låtar hämtades.`;
}

function renderTracks() {
  trackList.innerHTML = '';

  for (const track of tracks) {
    const row = document.createElement('div');
    const title = document.createElement('span');
    const playButton = document.createElement('button');

    title.textContent = `${track.title} – ${track.artist}`;
    playButton.textContent = 'Spela';

    playButton.addEventListener('click', function () {
      playTrack(track);
    });

    row.append(title, playButton);
    trackList.append(row);
  }
}

async function playTrack(track) {
  audioPlayer.src = track.audioUrl;
  nowPlaying.textContent = `${track.title} – ${track.artist}`;

  try {
    await audioPlayer.play();
    statusText.textContent = `Spelar ${track.title}`;
    await sendPlayEvent(track);
    localStorage.setItem('lastTrackId', track.id);
  } catch (error) {
    console.error('Kunde inte spela upp låten:', error);
    statusText.textContent = `Kunde inte spela ${track.title}.`;
  }
}

async function uploadTrack(file) {
  if (!file) {
    statusText.textContent = 'Välj en .mp3-fil först.';
    return;
  }

  if (!file.name.toLowerCase().endsWith('.mp3')) {
    statusText.textContent = 'Endast .mp3-filer kan laddas upp.';
    return;
  }

  statusText.textContent = `Laddar upp ${file.name}...`;

  try {
    const response = await fetch('/api/tracks', {
      method: 'POST',
      headers: {
        'X-Filename': file.name
      },
      body: file
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Uppladdningen misslyckades');
    }

    statusText.textContent = `${file.name} laddades upp.`;
    uploadInput.value = '';
    await loadTracks();
    console.log('Uppladdad låt:', result);
  } catch (error) {
    console.error('Kunde inte ladda upp låten:', error);
    statusText.textContent = error.message || 'Kunde inte ladda upp låten.';
  }
}

uploadButton.addEventListener('click', async function () {
  const file = uploadInput.files[0];
  await uploadTrack(file);
});

function getVisitorId() {
  let visitorId = localStorage.getItem('visitorId');

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem('visitorId', visitorId);
  }

  return visitorId;
}

const visitorId = getVisitorId();
console.log('Webbläsarens visitorId:', visitorId);

loadTracks();

async function sendPlayEvent(track) {
  const eventData = {
    type: 'play',
    trackId: track.id,
    visitorId: visitorId
  };

  const response = await fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
  });

  const result = await response.json();
  console.log('Svar från POST /api/events:', result);
}
