const PAINTING_THIN_SIDE_LENGTH = 0.1;

const blankMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
});

const transparentMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
});

const blankPaintingSideTextures = [
    blankMaterial,
    blankMaterial,
    blankMaterial,
    blankMaterial,
    blankMaterial,
    blankMaterial,
];

const transParentPaintingSideTextures = [
    transparentMaterial,
    transparentMaterial,
    transparentMaterial,
    transparentMaterial,
    transparentMaterial,
    transparentMaterial,
];

let makePainting = function(
    pos = { x: 40, y: 40, z: 40 },
    side = 0,
    sideTexturePath = "paintings/default.png",
    paintingSize = { x: 20, y: 20, z: 20 },
    transparent = false,
    pixelated = true,
    doubleSided = false
) {
    let sideTextures = blankPaintingSideTextures;

    if (transparent) {
        sideTextures = transParentPaintingSideTextures;
    }

    let loader = new THREE.TextureLoader();
    loader.setPath("assets/textures/");

    let paintingMaterial = new THREE.MeshBasicMaterial({
        map: loader.load(sideTexturePath),
    });

    if (pixelated) {
        paintingMaterial.map.minFilter = THREE.NearestFilter;
        paintingMaterial.map.magFilter = THREE.NearestFilter;
    }

    sideTextures[side] = paintingMaterial;

    if (doubleSided) {
        sideTextures[(side + 1) % 6] = paintingMaterial;
    }

    let paintingUnmodifiedGeometry = new THREE.BoxBufferGeometry(1, 1, 1);

    let mesh = new THREE.Mesh(paintingUnmodifiedGeometry, sideTextures);

    mesh.position.x = pos.x;
    mesh.position.y = pos.y;
    mesh.position.z = pos.z;

    if (isNaN(paintingSize)) {
        mesh.scale.x = paintingSize.x;
        mesh.scale.y = paintingSize.y;
        mesh.scale.z = paintingSize.z;
    } else {
        mesh.scale.x = paintingSize;
        mesh.scale.y = paintingSize;
        mesh.scale.z = paintingSize;

        switch (side) {
            case 0:
            case 1:
                mesh.scale.x = PAINTING_THIN_SIDE_LENGTH;
                break;

            case 2:
            case 3:
                mesh.scale.y = PAINTING_THIN_SIDE_LENGTH;
                break;

            case 4:
            case 5:
                mesh.scale.z = PAINTING_THIN_SIDE_LENGTH;
                break;

            default:
                mesh.scale.x = PAINTING_THIN_SIDE_LENGTH;
                break;
        }
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = true;

    return mesh;
}

/*
new THREE.MeshBasicMaterial({ map: loader.load('images/d.png')}), //right side
new THREE.MeshBasicMaterial({ map: loader.load('images/a.png')}), //left side
new THREE.MeshBasicMaterial({ map: loader.load('images/n.png')}), //top side
new THREE.MeshBasicMaterial({ map: loader.load('images/k.png')}), //bottom side
new THREE.MeshBasicMaterial({ map: loader.load('images/a.png')}), //front side
new THREE.MeshBasicMaterial({ map: loader.load('images/m.png')}), //back side
*/
