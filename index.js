// AudioContext and analyser integration from Ali Görkem's
// Pen "Audio Visualizer #3"
// https://codepen.io/agorkem/pen/PwyNOg/

var PLAY, LOCK = false;

window.onload = function () {
  var audio, analyser, audioContext, sourceNode, stream;

  var svg = document.getElementById("svg"),
    svgNS = svg.namespaceURI,
    polygon = document.createElementNS(svgNS, "polygon"),
    points = [];

  var width = window.innerWidth,
    height = window.innerHeight,
    maxHeight = height * 0.5,
    fftSize = 512,
    c = 0;

  PLAY = function (filename, length) {
    if (!LOCK) {
      LOCK = true;
      audio = new Audio(filename);
      setTimeout(function () {
        LOCK = false;
      }, length);
      setup();
    }
  };

  function setup() {
    audio.addEventListener("canplay", function() {
      document.body.className += "loaded";
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
      analyser = analyser || audioContext.createAnalyser();
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 1;
      analyser.fftSize = fftSize;

      sourceNode = audioContext.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      sourceNode.connect(audioContext.destination);

      audio.play();
      update();
    });
  }

  function getPoints(freqValue, freqSequence, freqCount, colorSequence) {
    var freqRatio = freqSequence / freqCount,
      x1 = width / 2 + Math.cos(freqSequence * Math.PI / freqCount) * freqValue / 0.95,
      y1 = height / 2 + Math.sin(freqSequence * Math.PI / freqCount) * freqValue / 0.95,
      x2 = width / 2 + Math.cos(freqSequence * Math.PI / -freqCount) * freqValue / 0.95,
      y2 = height / 2 + Math.sin(freqSequence * Math.PI / -freqCount) * freqValue / 0.95;

    return [x1 + "," + y1, x2 + "," + y2];
  }

  svg.setAttribute("width", width + "px");
  svg.setAttribute("height", height + "px");
  svg.setAttribute("viewBox", "0 0 " + width + " " + height);
  polygon.setAttribute(
    "transform",
    "rotate(90 " + width / 2 + " " + height / 2 + ")"
  );
  svg.appendChild(polygon);

  function update() {
    var freqArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(freqArray);

    // clear points array
    var points1 = [],
      points2 = [];

    var average = 0;
    // for each frequency
    for (var i = 0; i < freqArray.length; i++) {
      var p = getPoints(freqArray[i], i + 1, freqArray.length, c);
      points1.push(p[0]);
      points2.push(p[1]);
      average += freqArray[i];
    }
    average /= freqArray.length;

    var avgRatio = (average - 100) / (255 - 100);
    polygon.setAttribute("points", [points1, points2.reverse()].join(" "));
    polygon.setAttribute(
      "fill",
      "hsl(" + c + ",100%," + (avgRatio * 60 + 10) + "%)"
    );

    c += 0.5;
    requestAnimationFrame(update);
  }
};

// Pen "VU Meter from MIC Input" from Travis Holliday
// https://codepen.io/travisholliday/pen/gyaJk

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
if (navigator.getUserMedia) {
  navigator.getUserMedia({ audio: true }, function (stream) {
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;

      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);

      javascriptNode.onaudioprocess = function() {
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        var values = 0;

        var length = array.length;
        for (var i = 0; i < length; i++) {
          values += array[i];
        }

        var average = values / length;

        if (average > 80) {
          PLAY("sounds/kick.wav", 100000);
        }
      };
    },
    function(err) {
      console.log("The following error occured: " + err.name);
    }
  );
} else {
  console.log("getUserMedia not supported");
}
