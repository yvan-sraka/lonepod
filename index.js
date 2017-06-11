// AudioContext and analyser integration from Ali Görkem's
// Pen "Audio Visualizer #3"
// https://codepen.io/agorkem/pen/PwyNOg/

var PLAY, LOCK = false;

window.onload = function () {
  var audio, analyser, audioContext, sourceNode, stream, requestId;

  var svg = document.getElementById("svg"),
    svgNS = svg.namespaceURI,
    polygon = document.createElementNS(svgNS, "polygon"),
    points = [];

  var width = window.innerWidth,
    height = window.innerHeight,
    maxHeight = height * 0.5,
    fftSize = 512,
    c = 0;

  PLAY = function (filename) {
    if (!LOCK) {
      LOCK = true;
      audio = new Audio(filename);
      setup();
    } else {
      console.log("LOCKED");
    }
  };

  function setup() {
    audio.addEventListener("canplay", function() {
      document.body.className += "loaded";
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
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
    audio.addEventListener("ended", function () {
      audioContext.close().then(function() {
        console.log("UNLOCKED");
        function getRandomArbitrary(min, max) {
          return Math.floor(Math.random() * (max - min) + min);
        }
        setTimeout(function () {
          LOCK = false;
        }, getRandomArbitrary(2000, 5000));
      });
    });

    audio.addEventListener("error", function () {
      console.log('ERROR');
      audioContext.close().then(function() {
        console.log("UNLOCKED");
        function getRandomArbitrary(min, max) {
          return Math.floor(Math.random() * (max - min) + min);
        }
        setTimeout(function () {
          LOCK = false;
        }, getRandomArbitrary(2000, 5000));
      });
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
    polygon.setAttribute("fill", "none");
    polygon.setAttribute("stroke-width", 5);
    polygon.setAttribute(
      "stroke",
      "hsl(200, " + (100 * Math.sin(c / 20)) + "%, " + (avgRatio * 40 + 20) + "%)"
    );

    c += 0.5;
    if (requestId) {
      window.cancelAnimationFrame(requestId);
    }
    requestId = window.requestAnimationFrame(update);
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

        /***** BRAIN OF THE LONEPOD *****/
        function getRandomArbitrary(min, max) {
          return Math.floor(Math.random() * (max - min) + min);
        }

        /* BUGS :
        PLAY("sounds/indistinct1.mp4");
        PLAY("sounds/grognement2.wav");
        PLAY("sounds/exclamation.mp4"); //pas d'erreur mais pas de son !!!
        */

        if (average > 50) {
          switch (getRandomArbitrary(0, 4)) {
            case 1:
              PLAY("sounds/chut1.mp4");
              break;
            case 2:
              PLAY("sounds/hush.wav");
              break;
            case 3:
              PLAY("sounds/gromellement.mp4");
              break;
            default:
              PLAY("sounds/chut2.mp4");
              break;
          }
        } else {
          switch (getRandomArbitrary(0, 6)) {
            case 1:
              PLAY("sounds/toux2.mp4");
              break;
            case 3:
              PLAY("sounds/grognement2.mp4");
              break;
            case 4:
              PLAY("sounds/toux2.mp4");
              break;
            default:
              PLAY("sounds/sifflement.mp4");
              break;
          }
         }

        /********************************/
      };
    },
    function(err) {
      console.log("The following error occured: " + err.name);
    }
  );
} else {
  console.log("getUserMedia not supported");
}
