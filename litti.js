var currentFileName = null,
    autosaveTimer = null,
    playheadTimer = null,
    playing = false;

var TOGGLE_KEY_CODE = (function(platform) {
    if (platform === "MacIntel") {
        return 192;
    }
    return 220;
}(window.navigator.platform));

function els(selector) {
    return document.querySelectorAll(selector);
}

function el(selector) {
    return els(selector)[0];
}

function focusTranscript() {
    document.querySelector(".transcript").focus();
}

function getAudio() {
    return document.getElementsByTagName("audio")[0];
}

function ready(filename) {
    currentFileName = filename;

    [].forEach.call(els(".hidden-until-ready"), function(e) {
        e.classList.remove("hidden");
    });
    holder.classList.add("hidden");

    var audio = getAudio();
    audio.onloadeddata = function() {
        loadPosition(filename);

        autosaveTimer = setInterval(function() {
            savePosition(filename);
            saveTranscript(filename);
        }, 1000);

        audio.addEventListener("play", function(e) {
            playing = true;
            (function animloop() {
                if (playing) {
                    requestAnimationFrame(animloop);
                }
                updateProgress();
            }());
        }, false);

        audio.addEventListener("pause", function(e) {
            playing = false;
        }, false);

        audio.addEventListener("seeked", updateProgress, false);
    }

    loadTranscript(filename);
    focusTranscript();
}

function updateProgress() {
    el(".duration").style.width = (getAudio().currentTime * 100 / getAudio().duration) + '%';
}

function togglePlayState() {
    var audio = getAudio();
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}

var holder = document.getElementById('holder');
holder.ondragover = function() {
    this.className = 'hover';
    return false;
};

holder.ondragend = function() {
    this.className = '';
    return false;
};

holder.ondrop = function(e) {
    this.className = '';
    e.preventDefault();

    var file = e.dataTransfer.files[0],
        reader = new FileReader();

    reader.onload = function(event) {
        getAudio().src = event.target.result;
        ready(file.name);
    };
    reader.readAsDataURL(file);

  return false;
};

function loadPosition(filename) {
    var position = localStorage.getItem("position_" + filename);
    if (position !== null) {
        getAudio().currentTime = parseFloat(position, 10);
    }
}

function savePosition(filename) {
    localStorage.setItem("position_" + filename,
        "" + getAudio().currentTime);
}

function loadTranscript(filename) {
    var transcript = localStorage.getItem("transcript_" + filename);
    if (transcript !== null) {
        el(".transcript").value = transcript;
        updateWordCount();
    }
}

function saveTranscript(filename) {
    localStorage.setItem("transcript_" + filename, el(".transcript").value);
}

function updateWordCount() {
    var count = el(".transcript").value.trim().split(/\s+/).length;
    el(".word-count").innerHTML = count;
}

function download() {
    var filename = 'transcript_' + currentFileName + '.txt';
    var text = el(".transcript").value;
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    pom.click();
}

function adjustPlaybackRate(amount) {
    var rate = Math.round((getAudio().playbackRate + amount) * 10) / 10;
    if (rate >= 0.5 && rate <= 1.5) {
        getAudio().playbackRate = rate;
        el(".playback-rate").innerHTML = rate + 'x';
    }
}

document.onkeydown = function(e) {
    if (e.shiftKey && e.keyCode === 9) { // shift-tab
        e.preventDefault();
        getAudio().currentTime += 5;
        return;
    }

    if (e.altKey && e.keyCode === 187) {
        e.preventDefault();
        return adjustPlaybackRate(.1);
    }

    if (e.altKey && e.keyCode === 189) {
        e.preventDefault();
        return adjustPlaybackRate(-.1);
    }

    if (e.keyCode === 9) { // tab
        e.preventDefault();
        getAudio().currentTime -= 5;
        return;
    }

    if (e.keyCode === TOGGLE_KEY_CODE) { // §
        e.preventDefault();
        togglePlayState();
        return;
    }

    if (e.keyCode < 65 || e.keyCode > 90) { // other than a..z
        updateWordCount();
    }
}

if (typeof window.FileReader !== 'undefined') {
    holder.classList.remove("hidden");
}

document.onreadystatechange = function() {
    if (document.readyState == "complete") {
        el(".download-file").addEventListener("click", download, false);
    }
}
