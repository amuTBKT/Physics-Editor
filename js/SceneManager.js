var SceneManager = (function(){

	function SceneManager(){
		this.STATE_DEFAULT_MODE 	= 0;
		this.STATE_SHAPE_EDIT_MODE 	= 1;
		this.STATE_BODY_EDIT_MODE 	= 2;

		this.state = this.STATE_DEFAULT_MODE;
		this.bodies = [];
		this.selectedBodies = [];
		this.selectedShapes = [];
		this.selectedVertices = [];
	}
	// SceneManager.STATE_SHAPE_DRAW_MODE = 4;

	SceneManager.prototype.addBody = function(body){
		this.bodies.push(body);
	};

	var instance;
	return{
		getInstance: function(){
			if (instance == null){
				instance = new SceneManager();
				instance.constructor = null;
			}
			return instance;
		}
	};

})();