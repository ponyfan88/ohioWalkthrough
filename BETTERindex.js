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

            /*
        case 32: // space
            if (canJump === true)
                velocity.y +=
                    run === false
                        ? scope.jumpHeight
                        : scope.jumpHeight + 50;
            canJump = false;
            break;*/

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

document.addEventListener("mousemove", onMouseMove, false);
document.addEventListener("keydown", onKeyDown, false);
document.addEventListener("keyup", onKeyUp, false);
document.addEventListener("mousedown", onMouseDownClick, false);
document.addEventListener("mouseup", onMouseUpClick, false);