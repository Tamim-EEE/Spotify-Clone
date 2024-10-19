let currentSong = new Audio();
let playButton = document.getElementById("playButton");
let vol = document.querySelector("#vol");

let cardContainer = document.querySelector(".card-container");
let songs;
let currFolder;
let previousVolume = 0.1; // Initialize to a default volume

// Function for converting seconds to min
function convertSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  seconds = Math.floor(seconds);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
  const formattedSeconds =
    remainingSeconds < 10 ? "0" + remainingSeconds : remainingSeconds;

  return formattedMinutes + ":" + formattedSeconds;
}

// Function to load and play the music track
const playMusic = (track, pause = false) => {
  currentSong.src = `/${currFolder}/` + track;

  if (!pause) {
    currentSong.play();
    playButton.src = "./svg/pause.svg";
  }

  let decodedCurrentSong = songs.indexOf(track);
  document.querySelector(".songinfo").textContent = decodeURI(track);
  document.querySelector(".songtime").textContent = "00:00 / 00:00";
};

async function getSongs(folder) {
  currFolder = folder;
  try {
    // Remove hardcoded localhost URL
    let a = await fetch(`${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    songs = [];

    for (let i = 0; i < as.length; i++) {
      const element = as[i];
      if (element.href.endsWith(".mp3")) {
        songs.push(decodeURI(element.href).split(`/${folder}/`)[1]);
      }
    }

    // Show all the songs
    let songUl = document.querySelector(".songList ul");
    songUl.innerHTML = "";

    // Remove hardcoded localhost URL for fetching info.json
    let t = await fetch(`${folder}/info.json`);
    let author = await t.json();

    let songListHTML = "";
    for (const song of songs) {
      songListHTML += `
        <li>
          <img class="invert size" src="./svg/music.svg" alt="" />
          <div class="info">
            <div>${decodeURI(song)}</div>
            <div>${author.singer}</div>
          </div>
          <div class="playnow">
            <span>Play now</span>
            <img class="invert playsvg" src="./svg/play.svg" alt="" />
          </div>
        </li>`;
    }
    songUl.innerHTML = songListHTML;

    // Attach an event listener to each song
    Array.from(songUl.getElementsByTagName("li")).forEach((e) => {
      e.addEventListener("click", () => {
        let songName = e.querySelector(".info").firstElementChild.textContent;
        playMusic(songName);
        playButton.src = "./svg/pause.svg"; // Play the clicked song
      });
    });
  } catch (error) {
    console.error("Error fetching songs:", error);
  }
}

async function displayAlbums() {
  try {
    let a = await fetch(`/songs/`); // Remove hardcoded localhost URL
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let array = Array.from(anchors);

    for (let i = 0; i < array.length; i++) {
      const e = array[i];
      if (e.href.includes("/songs/")) {
        let folder = e.href.split("/").splice(-1)[0]; // Use -2 to avoid an empty string when splitting by '/'

        // Remove hardcoded localhost URL
        let a = await fetch(`/songs/${folder}/info.json`);
        if (!a.ok) {
          throw new Error(`Could not fetch info.json for folder: ${folder}`);
        }

        let albumMeta = await a.json();

        cardContainer.innerHTML += `
          <div data-folder="${folder}" class="card">
            <div class="play">
              <svg class="play-button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <circle cx="256" cy="256" r="256" fill="#66cc66" />
                <path d="M188.3 147.1c-7.6 4.2-12.3 12.3-12.3 20.9v176c0 8.7 4.7 16.7 12.3 20.9s16.8 4.1 24.3-.5l144-88c7.1-4.4 11.5-12.1 11.5-20.5s-4.4-16.1-11.5-20.5l-144-88c-7.4-4.5-16.7-4.7-24.3-.5z" fill="black" />
              </svg>
            </div>
            <img src="./songs/${folder}/cover.jpg" alt="" />
            <h2>${albumMeta.title}</h2>
            <p>${albumMeta.description}</p>
          </div>`;
      }
    }

    // Add event listener to load folder songs
    Array.from(document.getElementsByClassName("card")).forEach((e) => {
      e.addEventListener("click", async (item) => {
        await getSongs(`songs/${item.currentTarget.dataset.folder}`);
        playMusic(songs[0]);
      });
    });
  } catch (error) {
    console.error("Error displaying albums:", error);
  }
}

// Play next song automatically after current one finishes
const playNextSong = () => {
  let decodedCurrentSong = songs.indexOf(
    decodeURI(currentSong.src.split("/").slice(-1)[0])
  );
  decodedCurrentSong = (decodedCurrentSong + 1) % songs.length; // Loop back to first song after last
  playMusic(songs[decodedCurrentSong]);
};

// Main function to initialize everything
async function main() {
  // Get the list of all songs
  await getSongs("songs/Arijit-Sing");
  playMusic(songs[0], true);
  document.querySelector(".range input").value = 50;
  currentSong.volume = 0.5;

  // Display albums
  displayAlbums();

  // Attach event listener to the play/pause button
  playButton.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play(); // Play if paused
      playButton.src = "./svg/pause.svg"; // Change icon to pause
    } else {
      currentSong.pause(); // Pause if playing
      playButton.src = "./svg/play.svg"; // Change icon to play
    }
  });

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").textContent = `${convertSeconds(
      currentSong.currentTime
    )} / ${convertSeconds(currentSong.duration)}`;
    if (currentSong.duration === currentSong.currentTime) {
      playButton.src = "./svg/play.svg";
    }
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    if (!isNaN(currentSong.duration)) {
      document.querySelector(".circle").style.left = percent + "%";
      currentSong.currentTime = (currentSong.duration * percent) / 100;
    }
  });

  // Hamburger menu
  document.querySelector(".hamburgerIcon").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0%";
  });

  document.querySelector(".cross").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-100%";
  });

  // Next song
  document.querySelector("#nextButton").addEventListener("click", () => {
    playNextSong();
    playButton.src = "./svg/pause.svg";
  });

  // Previous song
  document.querySelector("#previousButton").addEventListener("click", () => {
    let decodedCurrentSong = songs.indexOf(
      decodeURI(currentSong.src.split("/").slice(-1)[0])
    );
    decodedCurrentSong = (decodedCurrentSong - 1 + songs.length) % songs.length;
    playMusic(songs[decodedCurrentSong]);
    playButton.src = "./svg/pause.svg";
  });

  // Volume control
  document
    .querySelector(".range input")
    .addEventListener("change", (volume) => {
      currentSong.volume = parseInt(volume.target.value) / 100;
      if (currentSong.volume === 0) {
        vol.src = "./svg/mute.svg";
      } else {
        vol.src = "./svg/volume.svg";
      }

      previousVolume = currentSong.volume;
    });

  vol.addEventListener("click", () => {
    if (currentSong.volume !== 0) {
      vol.src = "./svg/mute.svg";
      previousVolume = currentSong.volume;
      currentSong.volume = 0;
      document.querySelector(".range input").value = 0;
    } else {
      vol.src = "./svg/volume.svg";
      currentSong.volume = previousVolume;
      document.querySelector(".range input").value = previousVolume * 100;
    }
  });

  // Event listener to play the next song when the current song ends
  currentSong.addEventListener("ended", () => {
    playNextSong();
  });
}

// Initialize the app
main();
