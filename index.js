import mapData from "./map.json" assert { type: "json" };
import musicData from "./music.json" assert { type: "json" };
import { OBB } from "three/addons/math/OBB.js";
import * as THREE from "three";
import * as PAINT from "painting";

// copy and pasted early version of firstpersoncontrols. works well enough. might be changed later.
let firstPersonControls = function (
    camera,
    MouseMoveSensitivity = 0.002,
    speed = 800.0,
    height = 30.0
) {
    let scope = this;

    scope.MouseMoveSensitivity = MouseMoveSensitivity;
    scope.speed = speed;
    scope.height = height;
    scope.click = false;

    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    let run = false;

    let velocity = new THREE.Vector3();
    let direction = new THREE.Vector3();

    let prevTime = performance.now();

    camera.rotation.set(0, 0, 0);

    let pitchObject = new THREE.Object3D();
    pitchObject.add(camera);

    let yawObject = new THREE.Object3D();
    yawObject.position.y = 10;
    yawObject.add(pitchObject);

    let PI_2 = Math.PI / 2;

    let onMouseMove = function (event) {
        if (scope.enabled === false) return;

        let movementX =
            event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        let movementY =
            event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * scope.MouseMoveSensitivity;
        pitchObject.rotation.x -= movementY * scope.MouseMoveSensitivity;

        pitchObject.rotation.x = Math.max(
            -PI_2,
            Math.min(PI_2, pitchObject.rotation.x)
        );
    };

    let onKeyDown = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true;
                break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;

            case 16: // shift
                run = true;
                break;
        }
    }.bind(this);

    let onKeyUp = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;

            case 16: // shift
                run = false;
                break;
        }
    }.bind(this);

    let onMouseDownClick = function (event) {
        if (!scope.enabled)
        {
            return;
        }
        scope.click = true;
    }.bind(this);

    let onMouseUpClick = function (event) {
        if (!scope.enabled) {
            return;
        }
        scope.click = false;
    }.bind(this);

    scope.dispose = function () {
        document.removeEventListener("mousemove", onMouseMove, false);
        document.removeEventListener("keydown", onKeyDown, false);
        document.removeEventListener("keyup", onKeyUp, false);
        document.removeEventListener("mousedown", onMouseDownClick, false);
        document.removeEventListener("mouseup", onMouseUpClick, false);
    };

    document.addEventListener("mousemove", onMouseMove, false);
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);
    document.addEventListener("mousedown", onMouseDownClick, false);
    document.addEventListener("mouseup", onMouseUpClick, false);

    scope.enabled = false;

    scope.getObject = function () {
        return yawObject;
    };

    scope.update = function () {
        let time = performance.now();
        let delta = (time - prevTime) / 1000;

        if (scope.enabled) {
            velocity.y -= 9.8 * 100.0 * delta;
            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;

            direction.z = Number(moveForward) - Number(moveBackward);
            direction.x = Number(moveRight) - Number(moveLeft);
            direction.normalize();

            let currentSpeed = scope.speed;
            
            if (run && (moveForward || moveBackward || moveLeft || moveRight)) {
                currentSpeed = currentSpeed + currentSpeed * 1.1;
            }

            if (moveForward || moveBackward) {
                velocity.z -= direction.z * currentSpeed * delta;
            }

            if (moveLeft || moveRight) {
                velocity.x -= direction.x * currentSpeed * delta;
            }

            scope.getObject().translateX(-velocity.x * delta);
            scope.getObject().translateZ(velocity.z * delta);

            scope.getObject().position.y += velocity.y * delta;

            if (scope.getObject().position.y < scope.height) {
                velocity.y = 0;
                scope.getObject().position.y = scope.height;
            }
        }
        prevTime = time;
    };
};

const CAMERA_FOV = 75;
const DEBUG = true; // show walls, color floors, etc.

let instructions = document.querySelector("#instructions");

let description = document.getElementById("description");
let crosshair = document.getElementById("crosshair");

let songTitle = document.getElementById("song-title");

let camera;
let scene;
let renderer;
let controls;
let raycaster;
let world;

let interacted = false;

let wallMeshes = [];

let cameraPos;
let cameraDirection;

let uniquePaintings = {};

let rotatingSigns = []; // signs to rotate constantly

let audioPlayer = new Audio("assets/audio/test.mp3");
let songIndex = -1;
let sourceSongs = [...musicData.songs];
let shownSongs = [];
let songs = [];

setupAudio();

function setupAudio() {
    scrambleMusic();

    audioPlayer.addEventListener("ended", function () {
        document.getElementById("player").classList = ""

        songIndex++;
        audioPlayer.src = songs[songIndex];
        audioPlayer.play();

        if (songIndex >= songs.length) {
            scrambleMusic();
        }
    });
}

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

document.getElementById("previous-button").onclick = function () {
    console.log(songIndex);
    if (songIndex <= 0) {
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
};

document.getElementById("next-button").onclick = function () {
    
    console.log(songIndex)
    console.log(musicData.songs.length)

    if (songIndex == musicData.songs.length - 1) {
        console.log("reached end of songs. resetting!")
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
};

let audioPaused = false;

document.getElementById("pause-button").onclick = function () {
    if (audioPaused) {
        audioPlayer.play();

        document.getElementById("pause-button").innerText = "⏸️";
    } else {
        audioPlayer.pause();

        document.getElementById("pause-button").innerText = "▶️";
    }

    audioPaused = !audioPaused;
};

/*
tempMesh.translateX(50);
//tempMesh.translateY(50);
tempMesh.geometry.userData = {}
tempMesh.geometry.userData.obb = new OBB().fromBox3(tempMesh.geometry.boundingBox)
tempMesh.userData.obb = new OBB();
*/

let playerGeometry = new THREE.BoxGeometry(1, 1, 1);
playerGeometry.computeBoundingBox();
const playerMesh = new THREE.Mesh(
    playerGeometry,
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
);

playerMesh.geometry.userData = {};
playerMesh.geometry.userData.obb = new OBB().fromBox3(
    playerMesh.geometry.boundingBox
);
playerMesh.userData.obb = new OBB();
playerMesh.matrixAutoUpdate = true;

init();
animate();

function init() {
    //source for all audio: https://www.youtube.com/playlist?list=PLH88srMwnAUXRdIIk6tJPgSgwG4B5gvC9
    audioPlayer.loop = false; // dont loop audio
    audioPlayer.volume = 0; // muted by default for no particular reason. we set the volume later once we unpause.
    //audioPlayer.
    console.log("Audio Player Created");

    camera = new THREE.PerspectiveCamera(
        convertFov(CAMERA_FOV, window.innerWidth, window.innerHeight),
        window.innerWidth / window.innerHeight,
        0.1,
        3000
    );

    console.log(camera.fov);

    world = new THREE.Group();

    raycaster = new THREE.Raycaster(
        camera.getWorldPosition(new THREE.Vector3()),
        camera.getWorldDirection(new THREE.Vector3())
    );

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 0, 2000);
    //scene.fog = new THREE.FogExp2 (0xffffff, 0.007);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    renderer.domElement.id = "canvasse";
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    window.addEventListener(
        "resize",
        function () {
            camera.aspect = window.innerWidth / window.innerHeight;

            camera.fov = convertFov(
                CAMERA_FOV,
                window.innerWidth,
                window.innerHeight
            );
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
        },
        false
    );

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
    dirLight.shadow.camera.far = 3000;

    //let dirLightHeper = new THREE.SpotLightHelper( dirLight, 10 );
    //scene.add( dirLightHeper );

    controls = new firstPersonControls(camera);

    // pointer lock object forking for cross browser
    document.body.requestPointerLock =
        document.body.requestPointerLock || document.body.mozRequestPointerLock;
    document.exitPointerLock =
        document.exitPointerLock || document.mozExitPointerLock;

    // when we click request the pointer lock
    document.getElementById("instructions").onclick = function () {
        document.body.requestPointerLock();
    };

    // pointer lock event listeners
    // Hook pointer lock state change events for different browsers
    document.addEventListener("pointerlockchange", pointerLockChanged, false); //<-- when requested, we need to run the lockchangealert script
    document.addEventListener(
        "mozpointerlockchange",
        pointerLockChanged,
        false
    );

    function pointerLockChanged() {
        console.log(controls.moveForward)

        if (
            document.pointerLockElement === document.body ||
            document.mozPointerLockElement === document.body
        ) {
            if (!interacted) {
                interacted = true;
                audioPlayer.play(); // chrome developers decided to only play audio once the user presses something on the page
            }

            controls.enabled = true;
            instructions.style.display = "none";

            console.log("The pointer lock status is now locked");
        } else {
            controls.enabled = false;
            instructions.style.display = "-webkit-box";

            console.log("The pointer lock status is now unlocked");
        }
    }

    controls.enabled = false;
    instructions.style.display = "-webkit-box";

    scene.add(controls.getObject());

    // floor

    // instantialize loop variables
    let floorGeometry;
    let floorMaterial;
    let floor;

    // for every plane in the planes section of map.json
    mapData.planes.forEach((planeJSON) => {
        // plane geometry is formed with 4 numbers
        floorGeometry = new THREE.PlaneGeometry(
            planeJSON.plane[0],
            planeJSON.plane[1],
            planeJSON.plane[2],
            planeJSON.plane[3]
        );

        // give every floor plane a basic material
        floorMaterial = new THREE.MeshLambertMaterial();

        // if we are in debug mode give floors a more visible color
        if (DEBUG) {
            floorMaterial.color.setHSL(0.095, 1, 0.75);
        }

        // the floor
        floor = new THREE.Mesh(floorGeometry, floorMaterial);

        // shadows should be cast onto this surface
        floor.receiveShadow = true;

        // flip it so that if faces down
        floor.rotation.x = -Math.PI / 2;

        floor.position.x = planeJSON.pos.x;
        floor.position.y = planeJSON.pos.y;
        floor.position.z = planeJSON.pos.z;

        world.add(floor);
    });

    // world

    // paintings/signs

    // instantialize loop variables
    let painting;

    // for every painting in the paintings section of map.json
    mapData.paintings.forEach((paintingJSON) => {
        painting = PAINT.makePaintingFromJSON(paintingJSON);
        painting.userData.type = paintingJSON.type;
        painting.userData.data = paintingJSON.data;
        world.add(painting);

        if (paintingJSON.id != "") {
            uniquePaintings[paintingJSON.id] = painting;
        }

        if (paintingJSON.type == "rotating-sign") {
            rotatingSigns.push(painting);
        }
    });

    let wallMesh;
    let wallGeometry;

    mapData.walls.forEach((wallJSON) => {
        wallGeometry = new THREE.BoxGeometry(
            wallJSON.size.x,
            wallJSON.size.y,
            wallJSON.size.z
        );

        wallGeometry.computeBoundingBox();

        // if using debug, give it a specific color
        if (DEBUG) {
            wallMesh = new THREE.Mesh(
                wallGeometry,
                new THREE.MeshBasicMaterial({ color: 0x00ffff })
            );
        } else {
            wallMesh = new THREE.Mesh(wallGeometry);
        }

        // move the mesh into the corrent position, otherwise it will be at (0,0,0)
        wallMesh.position.x = wallJSON.pos.x;
        wallMesh.position.y = wallJSON.pos.y;
        wallMesh.position.z = wallJSON.pos.z;

        wallMesh.geometry.userData = {};
        wallMesh.geometry.userData.obb = new OBB().fromBox3(
            wallMesh.geometry.boundingBox
        );
        wallMesh.userData.obb = new OBB();

        wallMeshes.push(wallMesh);

        world.add(wallMesh);

        wallMesh.userData.obb.copy(wallMesh.geometry.userData.obb);
        wallMesh.userData.obb.applyMatrix4(wallMesh.matrixWorld);
    });

    world.add(playerMesh);

    scene.add(world);
}

function animate() {
    songTitle.innerText = shownSongs[songIndex];

    requestAnimationFrame(animate);

    cameraPos = camera.getWorldPosition(new THREE.Vector3());
    cameraDirection = camera.getWorldDirection(new THREE.Vector3());

    if (controls.enabled) {
        rotatingSigns.forEach((element) => {
            element.rotation.y += element.userData.data.rotationAmount;
        });

        crosshair.classList = "enabled";

        audioPlayer.volume = 1; // unmute audio player

        raycaster.set(cameraPos, cameraDirection);

        let intersects = raycaster.intersectObjects(world.children);

        if (intersects.length > 0) {
            let intersect = intersects[0];

            if (intersect.object.userData.type == "painting-clickable") {
                description.innerText =
                    intersect.object.userData.data.description;
                description.classList = "enabled";
            } else {
                description.classList = "";
            }
        } else {
            description.classList = "";
        }
    } else {
        crosshair.classList = "";
        audioPlayer.volume = 0.1; //lower audio player

        
        controls.moveForward = false;
        controls.moveBackward = false;
        controls.moveRight = false;
        controls.moveLeft = false;
    }

    playerMesh.position.x = cameraPos.x;
    playerMesh.position.z = cameraPos.z;

    // face the same. math stuff.
    playerMesh.rotation.y = Math.atan2(cameraDirection.x, cameraDirection.z);

    playerMesh.userData.obb.copy(playerMesh.geometry.userData.obb);
    playerMesh.userData.obb.applyMatrix4(playerMesh.matrixWorld);

    wallMeshes.forEach((wallMesh) => {
        wallMesh.userData.obb.copy(wallMesh.geometry.userData.obb);
        wallMesh.userData.obb.applyMatrix4(wallMesh.matrixWorld); // TODO: find a solution without this

        if (playerMesh.userData.obb.intersectsOBB(wallMesh.userData.obb)) {
            if (DEBUG) {
                wallMesh.material.color.set(0xff0000);
            }

            let playerPos = playerMesh.getWorldPosition(new THREE.Vector3());
            let playerDirection = playerMesh.getWorldDirection(
                new THREE.Vector3()
            );

            raycaster.set(playerPos, playerDirection);

            let intersects = raycaster.intersectObjects(wallMesh);

            console.log(intersects);

            if (intersects.length > 0) {
                console.log(intersects[0]);
            }
        } else {
            if (DEBUG) {
                wallMesh.material.color.set(0x00ffff);
            }
        }
    });

    controls.update();

    renderer.render(scene, camera);
}

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
