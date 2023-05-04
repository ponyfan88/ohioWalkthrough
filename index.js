import mapData from "./map.json" assert { type: "json" };
import { OBB } from 'three/addons/math/OBB.js';
import * as THREE from 'three';
import  * as PAINT from 'painting';

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
        if (scope.enabled === false) return;

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
        if (scope.enabled === false) return;

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
        if (scope.enabled === false) return;
        scope.click = true;
    }.bind(this);

    let onMouseUpClick = function (event) {
        if (scope.enabled === false) return;
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

        velocity.y -= 9.8 * 100.0 * delta;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        let currentSpeed = scope.speed;
        if (run && (moveForward || moveBackward || moveLeft || moveRight))
            currentSpeed = currentSpeed + currentSpeed * 1.1;

        if (moveForward || moveBackward)
            velocity.z -= direction.z * currentSpeed * delta;
        if (moveLeft || moveRight)
            velocity.x -= direction.x * currentSpeed * delta;

        scope.getObject().translateX(-velocity.x * delta);
        scope.getObject().translateZ(velocity.z * delta);

        scope.getObject().position.y += velocity.y * delta;

        if (scope.getObject().position.y < scope.height) {
            velocity.y = 0;
            scope.getObject().position.y = scope.height;
        }
        prevTime = time;
    };
};

let instructions = document.querySelector("#instructions");
let havePointerLock =
    "pointerLockElement" in document ||
    "mozPointerLockElement" in document ||
    "webkitPointerLockElement" in document;
if (havePointerLock) {
    let element = document.body;
    let pointerlockchange = function (event) {
        if (
            document.pointerLockElement === element ||
            document.mozPointerLockElement === element ||
            document.webkitPointerLockElement === element
        ) {
            controls.enabled = true;
            instructions.style.display = "none";
        } else {
            controls.enabled = false;
            instructions.style.display = "-webkit-box";
        }
    };
    let pointerlockerror = function (event) {
        instructions.style.display = "none";
    };

    document.addEventListener("pointerlockchange", pointerlockchange, false);
    document.addEventListener("mozpointerlockchange", pointerlockchange, false);
    document.addEventListener(
        "webkitpointerlockchange",
        pointerlockchange,
        false
    );
    document.addEventListener("pointerlockerror", pointerlockerror, false);
    document.addEventListener("mozpointerlockerror", pointerlockerror, false);
    document.addEventListener(
        "webkitpointerlockerror",
        pointerlockerror,
        false
    );

    instructions.addEventListener(
        "click",
        function (event) {
            element.requestPointerLock =
                element.requestPointerLock ||
                element.mozRequestPointerLock ||
                element.webkitRequestPointerLock;
            if (/Firefox/i.test(navigator.userAgent)) {
                let fullscreenchange = function (event) {
                    if (
                        document.fullscreenElement === element ||
                        document.mozFullscreenElement === element ||
                        document.mozFullScreenElement === element
                    ) {
                        document.removeEventListener(
                            "fullscreenchange",
                            fullscreenchange
                        );
                        document.removeEventListener(
                            "mozfullscreenchange",
                            fullscreenchange
                        );
                        element.requestPointerLock();
                    }
                };
                document.addEventListener(
                    "fullscreenchange",
                    fullscreenchange,
                    false
                );
                document.addEventListener(
                    "mozfullscreenchange",
                    fullscreenchange,
                    false
                );
                element.requestFullscreen =
                    element.requestFullscreen ||
                    element.mozRequestFullscreen ||
                    element.mozRequestFullScreen ||
                    element.webkitRequestFullscreen;
                element.requestFullscreen();
            } else {
                element.requestPointerLock();
            }
        },
        false
    );
} else {
    instructions.innerHTML = "Your browser not suported PointerLock";
}

let description = document.getElementById("description");
let crosshair = document.getElementById("crosshair")

let camera
let scene
let renderer
let controls
let raycaster
let world;

let uniquePaintings = {};

let rotatingSigns = []; // signs to rotate constantly

let geometry = new THREE.BoxGeometry(50,50,50)
geometry.computeBoundingBox();

const tempMesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({color: 0x00FFFF}),
);

tempMesh.translateX(50);
tempMesh.translateY(50);
tempMesh.geometry.userData = {}
tempMesh.geometry.userData.obb = new OBB().fromBox3(tempMesh.geometry.boundingBox)
tempMesh.userData.obb = new OBB();

    
let playerGeometry = new THREE.BoxGeometry(1,1,1);
playerGeometry.computeBoundingBox();
const playerMesh = new THREE.Mesh(
    playerGeometry,
    new THREE.MeshBasicMaterial({color: 0xff0000}),
);

playerMesh.geometry.userData = {};
playerMesh.geometry.userData.obb = new OBB().fromBox3(playerMesh.geometry.boundingBox);
playerMesh.userData.obb = new OBB();
playerMesh.matrixAutoUpdate = true;

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera(
        (2 *
            Math.atan(
                Math.tan(45) /
                    (((16 / 10) * window.innerWidth) / window.innerHeight)
            ) *
            180) /
            Math.PI,
        window.innerWidth / window.innerHeight,
        1,
        3000
    );

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

            camera.fov =
                (2 *
                    Math.atan(Math.tan(45) / ((16 / 10) * camera.aspect)) *
                    180) /
                Math.PI;
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
    scene.add(controls.getObject());

    // floor

    let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    let floorMaterial = new THREE.MeshLambertMaterial();
    floorMaterial.color.setHSL(0.095, 1, 0.75);

    let floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    world.add(floor);

    // world

    let painting;

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

    world.add(tempMesh);
    world.add(playerMesh);
    
    scene.add(world);
}

function animate() {
    requestAnimationFrame(animate);

    rotatingSigns.forEach((element) => {
        element.rotation.y += element.userData.data.rotationAmount;
    });

    let cameraPos = camera.getWorldPosition(new THREE.Vector3())

    if (controls.enabled) {
        crosshair.classList = "enabled"
        controls.update();

        raycaster.set(
            cameraPos,
            camera.getWorldDirection(new THREE.Vector3())
        );

        let intersects = raycaster.intersectObjects(world.children);

        if (intersects.length > 0) {
            let intersect = intersects[0];

            if (intersect.object.userData.type == "painting-clickable") {
                description.innerText = intersect.object.userData.data.description
                description.classList = "enabled"
            }
            else {
                description.classList = ""
            }
        } else {
            description.classList = ""
        }

        if (particles.length > 0) {
            let pLength = particles.length;
            while (pLength--) {
                particles[pLength].prototype.update(pLength);
            }
        }
    }
    else {
        crosshair.classList = ""
    }

    playerMesh.position.x = cameraPos.x;
    playerMesh.position.y = cameraPos.y;
    playerMesh.position.z = cameraPos.z;

    tempMesh.userData.obb.copy(tempMesh.geometry.userData.obb);
    playerMesh.userData.obb.copy(playerMesh.geometry.userData.obb);
    tempMesh.userData.obb.applyMatrix4(tempMesh.matrixWorld);
    playerMesh.userData.obb.applyMatrix4(playerMesh.matrixWorld);
    if (playerMesh.userData.obb.intersectsOBB(tempMesh.userData.obb)) {
        tempMesh.material.color.set(0xff0000);
        console.log("Collision Detected");
    }else{
        tempMesh.material.color.set(0x00ffff);
        console.log("No Collision Detected")
    }

    renderer.render(scene, camera);
}

let particles = new Array();
/*
function makeParticles(intersectPosition) {
    let totalParticles = 80;

    let pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.oldvertices = [];
    let colors = [];
    for (let i = 0; i < totalParticles; i++) {
        let position = randomPosition(Math.random());
        let vertex = new THREE.Vector3(position[0], position[1], position[2]);
        pointsGeometry.oldvertices.push([0, 0, 0]);
        pointsGeometry.vertices.push(vertex);

        let color = new THREE.Color(Math.random() * 0xffffff);
        colors.push(color);
    }
    pointsGeometry.colors = colors;

    let pointsMaterial = new THREE.PointsMaterial({
        size: 0.8,
        sizeAttenuation: true,
        depthWrite: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        vertexColors: THREE.VertexColors,
    });

    let points = new THREE.Points(pointsGeometry, pointsMaterial);

    points.prototype = Object.create(THREE.Points.prototype);
    points.position.x = intersectPosition.x;
    points.position.y = intersectPosition.y;
    points.position.z = intersectPosition.z;
    points.updateMatrix();
    points.matrixAutoUpdate = false;

    points.prototype.constructor = points;
    points.prototype.update = function (index) {
        let pCount = this.constructor.geometry.vertices.length;
        let positionYSum = 0;
        while (pCount--) {
            let position = this.constructor.geometry.vertices[pCount];
            let oldPosition = this.constructor.geometry.oldvertices[pCount];

            let velocity = {
                x: position.x - oldPosition[0],
                y: position.y - oldPosition[1],
                z: position.z - oldPosition[2],
            };

            let oldPositionX = position.x;
            let oldPositionY = position.y;
            let oldPositionZ = position.z;

            position.y -= 0.03; // gravity

            position.x += velocity.x;
            position.y += velocity.y;
            position.z += velocity.z;

            let wordlPosition = this.constructor.position.y + position.y;

            if (wordlPosition <= 0) {
                //particle touched the ground
                oldPositionY = position.y;
                position.y = oldPositionY - velocity.y * 0.3;

                positionYSum += 1;
            }

            this.constructor.geometry.oldvertices[pCount] = [
                oldPositionX,
                oldPositionY,
                oldPositionZ,
            ];
        }

        pointsGeometry.verticesNeedUpdate = true;

        if (positionYSum >= totalParticles) {
            particles.splice(index, 1);
            scene.remove(this.constructor);
            console.log("particle removed");
        }
    };
    particles.push(points);
    scene.add(points);
}

function randomPosition(radius) {
    radius = radius * Math.random();
    let theta = Math.random() * 2.0 * Math.PI;
    let phi = Math.random() * Math.PI;

    let sinTheta = Math.sin(theta);
    let cosTheta = Math.cos(theta);
    let sinPhi = Math.sin(phi);
    let cosPhi = Math.cos(phi);
    let x = radius * sinPhi * cosTheta;
    let y = radius * sinPhi * sinTheta;
    let z = radius * cosPhi;

    return [x, y, z];
}*/

let Controlers = function () {
    this.MouseMoveSensitivity = 0.002;
    this.speed = 800.0;
    this.height = 30.0;
};

window.onload = function () {
    let controler = new Controlers();
    /*
    let gui = new dat.GUI();
    gui.add(controler, "MouseMoveSensitivity", 0, 1)
        .step(0.001)
        .name("Mouse Sensitivity")
        .onChange(function (value) {
            controls.MouseMoveSensitivity = value;
        });
    gui.add(controler, "speed", 1, 8000)
        .step(1)
        .name("Speed")
        .onChange(function (value) {
            controls.speed = value;
        });
    gui.add(controler, "height", 1, 3000)
        .step(1)
        .name("Play Height")
        .onChange(function (value) {
            controls.height = value;
            camera.updateProjectionMatrix();
        });
    */
};
