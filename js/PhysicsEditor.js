function PhysicsEditor(canvas) {
	this.sceneManager = SceneManager.getInstance();
	this.viewport = Viewport.getInstance(canvas, this.sceneManager);
	this.uiManager = UIManager.getInstance(this.sceneManager);
	this.gameView = null;

	// directory containing textures
	this.resourceDirectory = "resources/";

	this.uiManager.initialize(this.viewport.getInputHandler());
	this.uiManager.playBackControls = $("#gameplayControls").find("button");
	
	// auto trace image shape generation paramters
	this.autoTrace = {
		xSpace : 1.0,
		ySpace : 1.0,
		concavity : 20
	};

	// play back controls //
	var ref = this;
	this.uiManager.playBackControls[0].addEventListener("click", function(){
		if (ref.gameView){
			ref.gameView = null;
			ref.viewport.getInputHandler().inGameMode = 0;
			$(this).removeClass("glyphicon-stop").addClass("glyphicon-play");
		}
		else {
			ref.gameView = new GameView(canvas, ref.viewport.getNavigator());
			ref.gameView.setup(ref.sceneManager.exportWorld());
			ref.viewport.getInputHandler().inGameMode = 1;
			$(this).removeClass("glyphicon-play").addClass("glyphicon-stop");
		}
	});
	this.uiManager.playBackControls[1].addEventListener("click", function(){
		if (ref.gameView != null)
			ref.gameView.paused = !ref.gameView.paused;
	});
	this.uiManager.playBackControls[2].addEventListener("click", function(){
		if (ref.gameView != null && ref.gameView.paused)
			ref.gameView.update();
	});
	//////////////////////

	// view controls //
	this.uiManager.viewControls = $("#viewControls").find("button");
	this.uiManager.viewControls.each(function(index){
		var action = $(this).data("event");
		this[action] = ref.viewport[action].bind(ref.viewport);
			
		this.addEventListener("click", function(e){
			e.preventDefault();
			e.target[action]();
		});
	});
	///////////////////

	// add event listeners to canvas
	var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";
	canvas.addEventListener(mousewheelevt, function(e){
		ref.viewport.onMouseWheel(e);
	});
	canvas.addEventListener("mousedown", function(e){
		e.preventDefault();
		ref.viewport.onMouseDown(e);
		ref.uiManager.onMouseDown(ref.viewport.getInputHandler());
	});
	canvas.addEventListener("mousemove", function(e){
		e.preventDefault();
		ref.viewport.onMouseMove(e);
		ref.uiManager.onMouseMove(ref.viewport.getInputHandler());
	});
	canvas.addEventListener("mouseup", function(e){
		ref.viewport.onMouseUp(e);
		ref.uiManager.onMouseUp(ref.viewport.getInputHandler());
	});
};

PhysicsEditor.prototype.cloneBody = function(body){
	var clone = body.clone();
	this.sceneManager.addBody(clone);
	return clone;
};

PhysicsEditor.prototype.cloneJoint = function(joint, cloneBodyA, cloneBodyB){
	var clone = joint.clone(cloneBodyA, cloneBodyB);
	if (cloneBodyA){
		this.sceneManager.addBody(clone.bodyA);
	}
	if (cloneBodyB){
		this.sceneManager.addBody(clone.bodyB);
	}
	this.sceneManager.addJoint(clone);
	return clone;
};

PhysicsEditor.prototype.getSelectedBodies = function(){
	return this.sceneManager.selectedBodies;
};

PhysicsEditor.prototype.getSelectedJoints = function(){
	return this.sceneManager.selectedJoints;
};

PhysicsEditor.prototype.getSelectedShapes = function(){
	return this.sceneManager.selectedShapes;
};

PhysicsEditor.prototype.getSelectedVertices = function(){
	return this.sceneManager.selectedVertices;
};

PhysicsEditor.prototype.getCurrentSelection = function(){
	return this.viewport.inputHandler.selection;
};

PhysicsEditor.prototype.getSceneManager = function(){
	return this.sceneManager;
};

PhysicsEditor.prototype.getViewport = function(){
	return this.viewport;
};

PhysicsEditor.prototype.getUIManager = function(){
	return this.uiManager;
};

PhysicsEditor.prototype.getGameView = function(){
	return this.gameView;
};