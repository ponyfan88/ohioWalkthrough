THREE.FirstPersonControls = function (
    camera,
    MouseMoveSensitivity = 0.002,
    speed = 800.0,
    height = 30.0
) {
    var scope = this;

    scope.MouseMoveSensitivity = MouseMoveSensitivity;
    scope.speed = speed;
    scope.height = height;
    scope.click = false;

    var moveForward = false;
    var moveBackward = false;
    var moveLeft = false;
    var moveRight = false;
    var run = false;

    var velocity = new THREE.Vector3();
    var direction = new THREE.Vector3();

    var prevTime = performance.now();

    camera.rotation.set(0, 0, 0);

    var pitchObject = new THREE.Object3D();
    pitchObject.add(camera);

    var yawObject = new THREE.Object3D();
    yawObject.position.y = 10;
    yawObject.add(pitchObject);

    var PI_2 = Math.PI / 2;

    var onMouseMove = function (event) {
        if (scope.enabled === false) return;

        var movementX =
            event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY =
            event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * scope.MouseMoveSensitivity;
        pitchObject.rotation.x -= movementY * scope.MouseMoveSensitivity;

        pitchObject.rotation.x = Math.max(
            -PI_2,
            Math.min(PI_2, pitchObject.rotation.x)
        );
    };

    var onKeyDown = function (event) {
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

    var onKeyUp = function (event) {
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

    var onMouseDownClick = function (event) {
        if (scope.enabled === false) return;
        scope.click = true;
    }.bind(this);

    var onMouseUpClick = function (event) {
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
        var time = performance.now();
        var delta = (time - prevTime) / 1000;

        velocity.y -= 9.8 * 100.0 * delta;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        var currentSpeed = scope.speed;
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

var instructions = document.querySelector("#instructions");
var havePointerLock =
    "pointerLockElement" in document ||
    "mozPointerLockElement" in document ||
    "webkitPointerLockElement" in document;
if (havePointerLock) {
    var element = document.body;
    var pointerlockchange = function (event) {
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
    var pointerlockerror = function (event) {
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
                var fullscreenchange = function (event) {
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

var camera, scene, renderer, controls, raycaster, arrow, world;

let columbusSign;

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera(
        2 * Math.atan(Math.tan(45) / (16/10 * window.innerWidth / window.innerHeight)) * 180 / Math.PI,
        window.innerWidth / window.innerHeight,
        1,
        3000
    );

    world = new THREE.Group();

    raycaster = new THREE.Raycaster(
        camera.getWorldPosition(new THREE.Vector3()),
        camera.getWorldDirection(new THREE.Vector3())
    );
    arrow = new THREE.ArrowHelper(
        camera.getWorldDirection(new THREE.Vector3()),
        camera.getWorldPosition(new THREE.Vector3()),
        3,
        0x000000
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
    renderer.outputEncoding = THREE.sRGBEncoding;

    window.addEventListener(
        "resize",
        function () {
            camera.aspect = window.innerWidth / window.innerHeight;

            camera.fov = 2 * Math.atan(Math.tan(45) / (16/10 * camera.aspect)) * 180 / Math.PI;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
        },
        false
    );

    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0, 100, 0.4);
    scene.add(light);

    var dirLight = new THREE.SpotLight(0xffffff, 0.5, 0.0, 180.0);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(0, 300, 100);
    dirLight.castShadow = true;
    dirLight.lookAt(new THREE.Vector3());
    scene.add(dirLight);

    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    dirLight.shadow.camera.far = 3000;

    //var dirLightHeper = new THREE.SpotLightHelper( dirLight, 10 );
    //scene.add( dirLightHeper );

    controls = new THREE.FirstPersonControls(camera);
    scene.add(controls.getObject());

    // floor

    var floorGeometry = new THREE.PlaneBufferGeometry(2000, 2000, 100, 100);
    var floorMaterial = new THREE.MeshLambertMaterial();
    floorMaterial.color.setHSL(0.095, 1, 0.75);

    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    world.add(floor);

    columbusSign = makePainting(
        { x: 0, y: 60, z: -100 },
        4,
        "signs/my-awesome-label.gif",
        { x: (830 / 95) * 20, y: 20, z: PAINTING_THIN_SIDE_LENGTH },
        false,
        true,
        false
    );

    world.add(columbusSign);

    /*
    columbusSign.userData.activated = function() {
        // FUN CODE GOES HERE
    }

    console.log(whocares)*/

    let newSign = makePainting(
        { x: 0, y: 20, z: -200 },
        4,
        "paintings/default.png",
        20,
        false,
        true,
        false
    );

    world.add(newSign)

    let new2Sign = makePainting(
        { x: 0, y: 20, z: -300 },
        4,
        "signs/my-awesome-label.gif",
        20,
        false,
        true,
        false
    );

    world.add(new2Sign)

    scene.add(world);
}

function animate() {
    requestAnimationFrame(animate);

    
    columbusSign.rotation.y += 0.1;

    if (controls.enabled === true) {
        controls.update();

        raycaster.set(
            camera.getWorldPosition(new THREE.Vector3()),
            camera.getWorldDirection(new THREE.Vector3())
        );

        if (controls.click === true) {
            var intersects = raycaster.intersectObjects(world.children);

            if (intersects.length > 0) {
                var intersect = intersects[0];
                makeParticles(intersect.point);
                console.log(intersect)
                intersect.object.rotation.y += 0.1;
                
                if (intersect.object.userData.activated != null) {
                    intersect.object.userData.activated();
                }
            }
        }

        if (particles.length > 0) {
            var pLength = particles.length;
            while (pLength--) {
                particles[pLength].prototype.update(pLength);
            }
        }
    }

    renderer.render(scene, camera);
}

var particles = new Array();

function makeParticles(intersectPosition) {
    var totalParticles = 80;

    var pointsGeometry = new THREE.Geometry();
    pointsGeometry.oldvertices = [];
    var colors = [];
    for (var i = 0; i < totalParticles; i++) {
        var position = randomPosition(Math.random());
        var vertex = new THREE.Vector3(position[0], position[1], position[2]);
        pointsGeometry.oldvertices.push([0, 0, 0]);
        pointsGeometry.vertices.push(vertex);

        var color = new THREE.Color(Math.random() * 0xffffff);
        colors.push(color);
    }
    pointsGeometry.colors = colors;

    var pointsMaterial = new THREE.PointsMaterial({
        size: 0.8,
        sizeAttenuation: true,
        depthWrite: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        vertexColors: THREE.VertexColors,
    });

    var points = new THREE.Points(pointsGeometry, pointsMaterial);

    points.prototype = Object.create(THREE.Points.prototype);
    points.position.x = intersectPosition.x;
    points.position.y = intersectPosition.y;
    points.position.z = intersectPosition.z;
    points.updateMatrix();
    points.matrixAutoUpdate = false;

    points.prototype.constructor = points;
    points.prototype.update = function (index) {
        var pCount = this.constructor.geometry.vertices.length;
        var positionYSum = 0;
        while (pCount--) {
            var position = this.constructor.geometry.vertices[pCount];
            var oldPosition = this.constructor.geometry.oldvertices[pCount];

            var velocity = {
                x: position.x - oldPosition[0],
                y: position.y - oldPosition[1],
                z: position.z - oldPosition[2],
            };

            var oldPositionX = position.x;
            var oldPositionY = position.y;
            var oldPositionZ = position.z;

            position.y -= 0.03; // gravity

            position.x += velocity.x;
            position.y += velocity.y;
            position.z += velocity.z;

            var wordlPosition = this.constructor.position.y + position.y;

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
    var theta = Math.random() * 2.0 * Math.PI;
    var phi = Math.random() * Math.PI;

    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);
    var sinPhi = Math.sin(phi);
    var cosPhi = Math.cos(phi);
    var x = radius * sinPhi * cosTheta;
    var y = radius * sinPhi * sinTheta;
    var z = radius * cosPhi;

    return [x, y, z];
}

var Controlers = function () {
    this.MouseMoveSensitivity = 0.002;
    this.speed = 800.0;
    this.height = 30.0;
};

window.onload = function () {
    var controler = new Controlers();
    /*
    var gui = new dat.GUI();
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
