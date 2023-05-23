import mapData from "./map.json" assert { type: "json" };
import musicData from "./music.json" assert { type: "json" };

import * as THREE from "three";
import * as PAINT from "painting";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { Octree } from "three/addons/math/Octree.js";
import { OctreeHelper } from "three/addons/helpers/OctreeHelper.js";

import { Capsule } from "three/addons/math/Capsule.js";

const clock = new THREE.Clock();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x606060);
scene.fog = new THREE.Fog(0x606060, 10, 20);

let world = new THREE.Group();
const ws = 0.03; // the paintings are made large, so we downscale them to 3% their size.
world.scale.set(ws, ws, ws);

const camera = new THREE.PerspectiveCamera(
    convertFov(90, window.innerWidth, window.innerHeight),
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
// determines what way is up
camera.rotation.order = "YXZ";

let light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
light.position.set(0, 100, 0.4);
scene.add(light);

let dirLight = new THREE.SpotLight(0xffffff, 0.5, 0.0, 180.0);
dirLight.color.setHSL(0.1, 1, 0.95);
dirLight.position.set(0, 300, 100);
dirLight.castShadow = true;
dirLight.lookAt(new THREE.Vector3());
scene.add(dirLight);

dirLight.shadow.mapSize.width = 4096;
dirLight.shadow.mapSize.height = 4096;
dirLight.shadow.camera.far = 10;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);

const STEPS_PER_FRAME = 5;

const worldOctree = new Octree();

const playerCollider = new Capsule(
    new THREE.Vector3(0, 0.35, 0),
    new THREE.Vector3(0, 1, 0),
    0.35
);

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let rotatingSigns = []; // signs to rotate constantly
let floatingSigns = []; // signs to rotate constantly

let instructions = document.querySelector("#instructions");

let description = document.getElementById("description");
let crosshair = document.getElementById("crosshair");

let songTitle = document.getElementById("song-title");
let buttonAdjacentBox = document.getElementById("button-adjacent-box");

let audioPlayer = new Audio("assets/audio/test.mp3");
let songIndex = -1;
let sourceSongs = [...musicData.songs];
let shownSongs = [];
let songs = [];

setupAudio();

// sets up audio and events for music changing
function setupAudio() {
    scrambleMusic();

    audioPlayer.addEventListener("ended", function () {
        document.getElementById("player").classList = "";

        songIndex++;
        audioPlayer.src = songs[songIndex];
        audioPlayer.play();

        if (songIndex >= songs.length) {
            scrambleMusic();
        }

        songChanged();
    });
}

// makes a new playlist
function scrambleMusic() {
    sourceSongs = [...musicData.songs];
    songIndex = -1;
    shownSongs = [];
    songs = [];

    for (let _ = 0; _ < musicData.songs.length; _++) {
        let i = Math.floor(Math.random() * sourceSongs.length);
        songs.push(musicData.path + sourceSongs[i] + ".mp3");
        shownSongs.push(sourceSongs[i]);
        sourceSongs.splice(i, 1);
    }
}

// when we click previous song, go back a song
document.getElementById("previous-button").onclick = function () {
    console.log(songIndex);
    if (songIndex <= 0) { // if we are at the first song, make a NEW playlist.
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        scrambleMusic();
        songIndex = 0;
        audioPlayer.src = songs[0];
        audioPlayer.play();
    } else {
        songIndex--;

        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        audioPlayer.src = songs[songIndex];
        audioPlayer.play();
    }

    songChanged();
};

// when we click next, skip the current song
document.getElementById("next-button").onclick = function () {
    console.log(songIndex);
    console.log(musicData.songs.length);

    if (songIndex == musicData.songs.length - 1) { // if we've reached the end of our playlist, shuffle us a new one
        console.log("reached end of songs. resetting!");
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        scrambleMusic();
        songIndex = 0;
        audioPlayer.src = songs[0];
        audioPlayer.play();
    } else {
        console.log("skipping");
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        songIndex++;
        audioPlayer.src = songs[songIndex];
        audioPlayer.play();
    }

    songChanged();
};

let audioPaused = false;

// pause the music when we click the pause button
document.getElementById("pause-button").onclick = function () {
    if (audioPaused) {
        audioPlayer.play();

        document.getElementById("pause-button").innerText = "⏸️";
    } else {
        audioPlayer.pause();

        document.getElementById("pause-button").innerText = "▶️";
    }

    audioPaused = !audioPaused;

    songChanged();
};

// update the buttons and song name to reflect current song
function songChanged() {
    songTitle.innerText = shownSongs[songIndex];
    buttonAdjacentBox.innerText =
        songIndex + 1 + "/" + musicData.songs.length + "\u00A0";
}

// when we click the controls box on the main page, request a pointer lock
document.getElementById("instructions").onclick = function () {
    document.body.requestPointerLock();
};

document.addEventListener("pointerlockchange", pointerLockChanged, false);
document.addEventListener("mozpointerlockchange", pointerLockChanged, false);

let interacted = false;
let controlsEnabled = false;

// makes our pointer dissapear! also initializes the whole audio system and everything.
function pointerLockChanged() {
    if (
        document.pointerLockElement === document.body ||
        document.mozPointerLockElement === document.body
    ) {
        if (!interacted) {
            interacted = true;
            audioPlayer.play(); // chrome developers decided to only play audio once the user presses something on the page
        }

        instructions.style.display = "none";
        controlsEnabled = true;

        console.log("The pointer lock status is now locked");
    } else {
        instructions.style.display = "-webkit-box";
        controlsEnabled = false;

        console.log("The pointer lock status is now unlocked");
    }
}

instructions.style.display = "-webkit-box";

let raycaster = new THREE.Raycaster(
    camera.getWorldPosition(new THREE.Vector3()),
    camera.getWorldDirection(new THREE.Vector3())
);

const keyStates = {};

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

// self-explanitory
document.addEventListener("keydown", (event) => {
    keyStates[event.code] = true;
});

// self-explanitory
document.addEventListener("keyup", (event) => {
    keyStates[event.code] = false;
});

// self-explanitory
document.body.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement === document.body) {
        camera.rotation.y -= event.movementX / 500;
        camera.rotation.x -= event.movementY / 500;
    }
});

window.addEventListener("resize", onWindowResize);

// function that changes camera FOV and renderer resolution on screen change.
// this is why we made convertFov()
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    camera.fov = convertFov(90, window.innerWidth, window.innerHeight);

    renderer.setSize(window.innerWidth, window.innerHeight);
}

// does player collisions.
function playerCollisions() {
    const result = worldOctree.capsuleIntersect(playerCollider);

    if (result) { //if we've collided, move back accordingly
        playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }
}

// update the player position, does all the friction work and moves the camera.
function updatePlayer(deltaTime) {
    let damping = Math.exp(-10 * deltaTime) - 1;

    const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
    playerCollider.translate(deltaPosition);

    playerVelocity.addScaledVector(playerVelocity, damping);

    playerCollisions();

    camera.position.copy(playerCollider.end);
}

// same thing as below without cross product
function getForwardVector() {
    camera.getWorldDirection(playerDirection);
    playerDirection.y = 0;
    playerDirection.normalize();

    return playerDirection;
}

// gets a much better player direction. the player direction is normally all jumbled, but you can use trig (or threejs functions) to un-jumble it.
function getSideVector() {
    camera.getWorldDirection(playerDirection);
    playerDirection.y = 0;
    playerDirection.normalize();
    playerDirection.cross(camera.up);

    return playerDirection;
}

// gets key states and adds player velocity based on them 
// (w - go forward)
// (a - go left)
// etc etc
function controls(deltaTime) {
    // gives a bit of air control
    let speedDelta = deltaTime * 25;

    if (keyStates["ShiftLeft"]) {
        speedDelta *= 2; // faster on sprint
    }

    if (keyStates["KeyW"]) {
        playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
    }

    if (keyStates["KeyS"]) {
        playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta));
    }

    if (keyStates["KeyA"]) {
        playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
    }

    if (keyStates["KeyD"]) {
        playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
    }
}

const loader = new GLTFLoader().setPath("assets/3d/");

// there are two different models, one for collisions and one for the room we display.
// this loads both of them
loader.load("collision.gltf", (gltf) => {
    gltf.scene.rotation.y = Math.PI;

    scene.add(gltf.scene);

    worldOctree.fromGraphNode(gltf.scene);

    gltf.scene.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
            child.material = new THREE.MeshLambertMaterial({
                color: 0x0000ff,
                transparent: true,
                opacity: 0,
                depthWrite: false
            });
        }
    });

    const helper = new OctreeHelper(worldOctree);
    helper.visible = false;
    scene.add(helper);

    // once we load the collisions, load the visuals
    loader.load("room.gltf", (gltf) => {
        gltf.scene.rotation.y = Math.PI;

        scene.add(gltf.scene);

        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = new THREE.MeshLambertMaterial({
                    color: 0xf0f0f0,
                    side: 2,
                    shading: THREE.FlatShading,
                    transparent: false,
                    opacity: 1
                });
            }
        });

        const helper = new OctreeHelper(worldOctree);
        helper.visible = false;
        scene.add(helper);

        addPaintings();
    });

    loader.load("scene.gltf", function (gltf) {
        const model = gltf.scene;
        model.position.setX(100);
        model.position.setY(0);
        model.position.setZ(-659);
        model.rotation.y += 1.57;

        const model_scale = 100 / 3
        model.scale.set(model_scale,model_scale,model_scale)

        world.add(model);
    })

    loader.load("scene.gltf", function (gltf) {
        const model = gltf.scene;
        model.position.setX(-180);
        model.position.setY(0);
        model.position.setZ(-659);
        model.rotation.y += 1.57;

        const model_scale = 100 / 3
        model.scale.set(model_scale,model_scale,model_scale)

        world.add(model);
    })
});

// adds paitings to scene. these are the pictures. reads from JSON.
function addPaintings() {
    // instantialize loop variables
    let painting;

    // for every painting in the paintings section of map.json
    mapData.paintings.forEach((paintingJSON) => {
        painting = PAINT.makePaintingFromJSON(paintingJSON);
        painting.userData.type = paintingJSON.type;
        painting.userData.data = paintingJSON.data;

        world.add(painting);

        /*
        if (paintingJSON.id != "") {
            uniquePaintings[paintingJSON.id] = painting;
        }*/

        if (paintingJSON.type == "rotating-sign") {
            rotatingSigns.push(painting);
        }

        if (paintingJSON.type == "floating-sign") {
            floatingSigns.push(
                {
                    "painting" : painting,
                    "startingY" : paintingJSON.pos.y,
                    "floatFrequency": paintingJSON.data.floatFrequency,
                    "floatAmount": paintingJSON.data.floatAmount,
                }
            )
        }
    });

    scene.add(world);

    animate();
}


//teleports the player if the camera falls (Out Of Bounds)
function teleportPlayerIfOob() {
    if (camera.position.y <= -25) {
        playerCollider.start.set(0, 0.35, 0);
        playerCollider.end.set(0, 1, 0);
        playerCollider.radius = 0.35;
        camera.position.copy(playerCollider.end);
        camera.rotation.set(0, 0, 0);
    }
}

//converts fov from one aspect ratio to another - useful for mobile view
function convertFov(fov, vw, vh) {
    const DEVELOPER_SCREEN_ASPECT_RATIO_HEIGHT = 10;
    const DEVELOPER_SCREEN_ASPECT_RATIO_WIDTH = 16;

    return (
        (Math.atan(
            Math.tan((fov * Math.PI) / 360) /
                ((DEVELOPER_SCREEN_ASPECT_RATIO_HEIGHT /
                    DEVELOPER_SCREEN_ASPECT_RATIO_WIDTH) *
                    (vw / vh))
        ) *
            360) /
        Math.PI
    );
}

// ran every frame
function animate() {
    const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

    // we look for collisions in substeps to mitigate the risk of
    // an object traversing another too quickly for detection.

    if (controlsEnabled) {
        for (let i = 0; i < STEPS_PER_FRAME; i++) {
            controls(deltaTime);
    
            updatePlayer(deltaTime);
    
            teleportPlayerIfOob();
        }

        rotatingSigns.forEach((element) => {
            element.rotation.y += element.userData.data.rotationAmount;
        });

        floatingSigns.forEach((element) => {
            element.painting.position.y = element.startingY + Math.sin(performance.now() / 180 * element.floatFrequency) * element.floatAmount
        });

        audioPlayer.volume = 1; // unmute audio player

        raycaster.set(
            camera.getWorldPosition(new THREE.Vector3()),
            camera.getWorldDirection(new THREE.Vector3())
        );

        let intersects = raycaster.intersectObjects(world.children);

        if (intersects.length > 0) {
            let intersect = intersects[0];

            if (intersect.object.userData.type == "painting-clickable") {
                description.innerText =
                    intersect.object.userData.data.description;
                description.classList = "enabled";

                crosshair.classList = "enabled";
            } else {
                description.classList = "";

                crosshair.classList = "";
            }
        } else {
            description.classList = "";

            crosshair.classList = "";
        }

        renderer.render(scene, camera);
    } else {
        crosshair.classList = "";
        audioPlayer.volume = 0.1; //lower audio player
    }

    requestAnimationFrame(animate); // run the same thing again
}