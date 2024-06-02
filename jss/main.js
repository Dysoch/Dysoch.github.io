
var gameloop = setInterval(function() {
    if (ticking) return;
    ticking = true;
    updateUI();

    // fps for debug only
    //var thisFrameTime = (thisLoop = new Date) - lastLoop;
    //frameTime += (thisFrameTime - frameTime) / filterStrength;
    //lastLoop = thisLoop;

    ticking = false;
}, 1000)