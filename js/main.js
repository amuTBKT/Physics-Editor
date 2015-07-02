var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;

var viewport, sceneManager, uiManager, gameView;
var lastElementSelected;

function init(){
	var canvas = document.getElementById("canvas");
	canvas.width = SCREEN_WIDTH * 0.8;
	canvas.height = SCREEN_HEIGHT * 0.8;

	sceneManager = SceneManager.getInstance();
	
	viewport = Viewport.getInstance(canvas, sceneManager);

	uiManager = UIManager.getInstance(sceneManager);
	uiManager.initialize(viewport.getInputHandler());
	uiManager.playBackControls = $("#controls").find("button");
	// play back controls //
	uiManager.playBackControls[0].addEventListener("click", function(){
		if (gameView){
			gameView = null;
			viewport.getInputHandler().inGameMode = 0;
			$(this).removeClass("glyphicon-stop").addClass("glyphicon-play");
		}
		else {
			gameView = new GameView(canvas, viewport.getNavigator());
			gameView.setup(sceneManager.exportWorld());
			// gameView.setup("resources/scene.json", true);
			viewport.getInputHandler().inGameMode = 1;
			$(this).removeClass("glyphicon-play").addClass("glyphicon-stop");
		}
	});
	uiManager.playBackControls[1].addEventListener("click", function(){
		if (gameView != null)
			gameView.paused = !gameView.paused;
	});
	uiManager.playBackControls[2].addEventListener("click", function(){
		if (gameView != null && gameView.paused)
			gameView.update();
	});
	//////////////////////

	document.addEventListener("mousedown", function(e){
		lastElementSelected = e.target;
	});

	viewport.canvas.addEventListener("mousewheel", function(e){
		viewport.onMouseWheel(e);
	});
	viewport.canvas.addEventListener("mousedown", function(e){
		e.preventDefault();
		viewport.onMouseDown(e);
		uiManager.onMouseDown(viewport.getInputHandler());
	});
	viewport.canvas.addEventListener("mousemove", function(e){
		e.preventDefault();
		viewport.onMouseMove(e);
		uiManager.onMouseMove(viewport.getInputHandler());
	}, false);
	viewport.canvas.addEventListener("mouseup", function(e){
		viewport.onMouseUp(e);
		uiManager.onMouseUp(viewport.getInputHandler());
	}, false);

	window.addEventListener("keydown", function(e){
		// console.log(e.which);
		if (lastElementSelected == viewport.canvas)
			viewport.onKeyDown(e);
	});
	window.addEventListener("keyup", function(e){
		// console.log(e.which);
		if (lastElementSelected == viewport.canvas)
			viewport.onKeyUp(e);

		// if (e.which == 13){
		// 	gameView.paused = !gameView.paused;
		// }

		// else if (e.which == 32){
		// 	if (gameView){
		// 		gameView = null;
		// 		viewport.getInputHandler().inGameMode = 0;
		// 	}
		// 	else {
		// 		gameView = new GameView(canvas, viewport.getNavigator());
		// 		gameView.setup(sceneManager.exportWorld());
		// 		// gameView.setup("resources/scene.json", true);
		// 		viewport.getInputHandler().inGameMode = 1;
		// 	}
		// }
	});

	sceneManager.createBody(Shape.SHAPE_BOX);
	sceneManager.createBody(Shape.SHAPE_CIRCLE);
	sceneManager.createBody(Shape.SHAPE_POLYGON);
}

// update loop 
function render() {	
	viewport.draw(gameView);
	
	setTimeout(render, 1000.0 / 60.0);
}
//-------------------------------------------//

// function UpdateLoop(){
// 	app.updateGameLogic();
// 	requestAnimationFrame(UpdateLoop);
// }

init();

setTimeout(render, 1000.0 / 60.0);