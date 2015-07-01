var UIManager = (function(){

	function UIManager(sceneManager){
		this.sceneManager 	 = sceneManager;
		this.xyInput         = [];
		this.taskbar         = [];
		this.playBackControls = [];
		this.shapeProperties = [];			// density, friction, restitution, isSensor, edit	
		this.bodyProperties  = [];			// name, userdata, type, isBullet, edit, tex_file, tex_width, tex_height
		this.jointProperties = [];			// name, userdata, type, collideConnected, joint_specific_parameters
		this.jointPropertyRows = [];
	}

	UIManager.prototype.initialize = function(inputHandler){
		var sceneManager = this.sceneManager;

		// hide separators
		var elementsToHide = document.getElementsByClassName("separator");
		for (var i = 0; i < elementsToHide.length; i++){
			elementsToHide[i].style.visibility = "hidden";
		}

		// initialize transform tool buttons
		$("#transformTools").find("button").each(function(index){
			var action = $(this).data("event");
			mixin(this, inputHandler, action);
			
			this.addEventListener("click", function(e){
				e.preventDefault();
				e.target[action]();
			});
		});

		// initialize pivot tool buttons
		$("#pivotTools").find("button").each(function(index){
			var action = $(this).data("event");
			mixin(this, inputHandler, action);
			
			this.addEventListener("click", function(e){
				e.preventDefault();
				e.target[action]();
			});
		});

		this.xyInput = [$("#input_x")[0], $("#input_y")[0]];

		this.xyInput[0].addEventListener("keypress", function(e){
			if (e.which == 13){							// enter pressed
				if (!isNaN(parseFloat(this.value))){
					if (inputHandler.transformTool == 5){
						sceneManager.setScaleOfSelectedObjects(parseFloat(this.value), null, 0, inputHandler);	
					}
					else if (inputHandler.transformTool == 7){
						sceneManager.setPositionOfSelectedObjects(parseFloat(this.value), null, 0, inputHandler);	
					}
					else if (inputHandler.transformTool == 6){
						sceneManager.setRotationOfSelectedObjects(parseFloat(this.value), 0, inputHandler);	
					}
				}
			}
		});

		this.xyInput[1].addEventListener("keypress", function(e){
			if (e.which == 13){							// enter pressed
				if (!isNaN(parseFloat(this.value))){
					if (inputHandler.transformTool == 5){
						sceneManager.setScaleOfSelectedObjects(null, parseFloat(this.value), 0, inputHandler);
					}
					else if (inputHandler.transformTool == 7){
						sceneManager.setPositionOfSelectedObjects(null, parseFloat(this.value), 0, inputHandler);	
					}
				}
			}
		});
		$("#loadScene").hide();
		$("#fileMenu").find("a").each(function(index){
			var action = $(this).data("event");

			mixin(this, sceneManager, action);
			
			this.addEventListener("click", function(e){
				e.preventDefault();
				if (action == 'loadScene'){
					$("#loadScene").trigger('click');
					return;
				}
				else if (action == 'saveScene'){
					var data = new Blob([JSON.stringify(sceneManager.saveScene(), null, 4)], {type:'text/plain'});
					var textFile = window.URL.createObjectURL(data);
					window.open(textFile);
					return;
				}
				else if (action == 'exportWorld'){
					var data = new Blob([JSON.stringify(sceneManager.exportWorld(), null, 4)], {type:'text/plain'});
					var textFile = window.URL.createObjectURL(data);
					window.open(textFile);
					return;
				}
				else if (action == 'exportSelection'){
					var data = new Blob([JSON.stringify(sceneManager.exportSelection(), null, 4)], {type:'text/plain'});
					var textFile = window.URL.createObjectURL(data);
					window.open(textFile);
					return;
				}
				e.target[action]();
			});
		});
		$('#loadScene').change(function(e){
			if (e.target.files.length < 0){
				return;
			}
			if(e.target.files[0].name){
				var reader =  new FileReader();
				reader.readAsText(e.target.files[0]);
				reader.onload =  function(e){
					sceneManager.newScene();
					sceneManager.loadScene(JSON.parse(e.target.result));
				}
			}
		});
		$("#addToScene").find("a").each(function(index){
			mixin(this, sceneManager, "createBody");
			
			var params = parseInt($(this).data("shape"));
			
			this.addEventListener("click", function(e){
				e.preventDefault();
				var shapeType = parseInt(params / 10);
				if (shapeType == 0){
					e.target["createBody"](shapeType);
				}
				else {
					e.target["createBody"](shapeType, params % 10);	
				}
			});
		});
		$("#addToBody").find("a").each(function(index){
			mixin(this, sceneManager, "createShape");
			
			var params = parseInt($(this).data("shape"));
			
			this.addEventListener("click", function(e){
				e.preventDefault();
				var shapeType = parseInt(params / 10);
				if (shapeType == 0){
					e.target["createShape"](shapeType);
				}
				else {
					e.target["createShape"](shapeType, params % 10);	
				}
			});
		});
		$("#createJoint").find("a").each(function(index){
			mixin(this, sceneManager, "createJoint");
			
			var type = parseInt($(this).data("type"));
			
			this.addEventListener("click", function(e){
				e.preventDefault();
				e.target["createJoint"](type);
			});
		});

		// properties of selected shape(s)
		this.shapeProperties =  $("#shape_properties").find("input");
		for (var i = 0; i < 3; i++){
			this.shapeProperties[i].addEventListener('keypress', function(e){
				if (e.which == 13){
					var property = $(this).data('property');
					for (var i = 0; i < sceneManager.selectedShapes.length; i++){
						if (parseFloat(this.value) != NaN)
							sceneManager.selectedShapes[i][property] = parseFloat(this.value);
					}
				}
			});
		}
		$(this.shapeProperties[3]).change(function(){
			for (var i = 0; i < sceneManager.selectedShapes.length; i++){
				var property = $(this).data('property');
				sceneManager.selectedShapes[i][property] = $(this).is(":checked");
			}
		});
		var ref = this;
		this.shapeProperties[4].addEventListener('click', function(){
			if (sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE){
				sceneManager.enterShapeEditMode();
				this.value = "Done";
				ref.updateShapePropertyView();
				ref.updateBodyPropertyView();
			}
			else if (sceneManager.state == sceneManager.STATE_SHAPE_EDIT_MODE){
				sceneManager.enterBodyEditMode();
				this.value = "Edit";
				ref.updateShapePropertyView();
				ref.updateBodyPropertyView();
			}
		});

		// properties of selected body(s)
		this.bodyProperties = $("#body_properties").find("input");
		this.bodyProperties.push($("#body_properties").find("select")[0]);
		for (var i = 0; i < 2; i++){
			this.bodyProperties[i].addEventListener('keypress', function(e){
				if (e.which == 13){
					var property = $(this).data('property');
					for (var i = 0; i < sceneManager.selectedBodies.length; i++){
						sceneManager.selectedBodies[i][property] = this.value;
					}
				}
			});
		}
		$(this.bodyProperties[2]).change(function(){
			for (var i = 0; i < sceneManager.selectedBodies.length; i++){
				var property = $(this).data('property');
				sceneManager.selectedBodies[i][property] = $(this).is(":checked");
			}
		});
		$(this.bodyProperties[3]).change(function(){
			for (var i = 0; i < sceneManager.selectedBodies.length; i++){
				var property = $(this).data('property');
				sceneManager.selectedBodies[i][property] = $(this).is(":checked");
			}
		});
		this.bodyProperties[4].addEventListener('click', function(){
			if (sceneManager.state == sceneManager.STATE_DEFAULT_MODE){
				sceneManager.enterBodyEditMode();
				this.value = "Done";
				ref.updateShapePropertyView();
				ref.updateBodyPropertyView();
				ref.updateJointPropertyView();
			}
			else if (sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE) {
				sceneManager.enterDefaultMode();
				this.value = "Edit";
				ref.updateShapePropertyView();
				ref.updateBodyPropertyView();
				ref.updateJointPropertyView();
			}
		});
		$(this.bodyProperties[12]).change(function(){
			for (var i = 0; i < sceneManager.selectedBodies.length; i++){
				var property = $(this).data('property');
				sceneManager.selectedBodies[i][property] = this.value;
			}
		});
		$(this.bodyProperties[5]).change(function(e){
			if (e.target.files == null && e.target.files.length < 0){
				return;
			}
			if(e.target.files[0].name && (e.target.files[0].type == "image/png" ||  e.target.files[0].type == "image/jpeg")){
				for (var i = 0; i < sceneManager.selectedBodies.length; i++){
					sceneManager.selectedBodies[i].setSprite("resources/" + e.target.files[0].name);
				}
			}
		});
		for (var i = 6; i < 12; i++){
			this.bodyProperties[i].addEventListener('keypress', function(e){
				if (e.which == 13){
					for (var i = 0; i < sceneManager.selectedBodies.length; i++){
						if (parseFloat(this.value) != NaN){
							var action = $(this).data('action');
							sceneManager.selectedBodies[i][action](parseFloat(this.value));
						}
					}
				}
			});
		}

		// properties of selected joint(s)
		this.jointProperties = $("#joint_properties").find("input");
		this.jointPropertyRows = $("#joint_properties").find("tr");
		for (var i = 0; i < 8; i++){
			if (i == 2 || i == 5){
				continue;
			}
			this.jointProperties[i].addEventListener('keypress', function(e){
				if (e.which == 13){
					for (var i = 0; i < sceneManager.selectedJoints.length; i++){
						var property = $(this).data('property');
						if (i < 2){
							sceneManager.selectedJoints[i][property] = this.value;
						}
						else {
							if (parseFloat(this.value) != null){
								sceneManager.selectedJoints[i][property] = parseFloat(this.value)
							}
						}
					}
				}
			});
		}
		$(this.jointProperties[2]).change(function(){
			var property = $(this).data('property');
			for (var i = 0; i < sceneManager.selectedJoints.length; i++){
				sceneManager.selectedJoints[i][property] =  $(this).is(":checked");
				console.log(property + " " + this.value);
			}
		});
		$(this.jointProperties[5]).change(function(){
			var property = $(this).data('property');
			for (var i = 0; i < sceneManager.selectedJoints.length; i++){
				sceneManager.selectedJoints[i][property] =  $(this).is(":checked");
			}
		});
		$(this.jointProperties[8]).change(function(){
			var property = $(this).data('property');
			for (var i = 0; i < sceneManager.selectedJoints.length; i++){
				sceneManager.selectedJoints[i][property] =  $(this).is(":checked");
			}
		});
		this.jointProperties[9].addEventListener('click', function(){
			if (sceneManager.selectedJoints[0].inEditMode){
				sceneManager.selectedJoints[0].inEditMode = false;
				this.value = "Edit";
			}
			else {
				sceneManager.selectedJoints[0].inEditMode = true;
				this.value = "Done"
			}
		});

		this.updateShapePropertyView();
		this.updateBodyPropertyView();
		this.updateJointPropertyView();
	};

	UIManager.prototype.onMouseDown = function(inputHandler){
		this.updateShapePropertyView();
		this.updateBodyPropertyView();
		this.updateJointPropertyView();

		// update input-xy
		if (inputHandler.selection.length != 1){
			this.xyInput[0].value = "";
			this.xyInput[1].value = "";
			return;
		}
		this.updateInputXY(inputHandler);
	};

	UIManager.prototype.onMouseMove = function(inputHandler){
		this.updateShapePropertyView();
		this.updateBodyPropertyView();
		this.updateJointPropertyView();

		// update input-xy
		if (inputHandler.selection.length != 1){
			this.xyInput[0].value = "";
			this.xyInput[1].value = "";
			return;
		}
		this.updateInputXY(inputHandler);
	};

	UIManager.prototype.onMouseUp = function(inputHandler){
		this.updateShapePropertyView();
		this.updateBodyPropertyView();
		this.updateJointPropertyView();

		if (inputHandler.selection.length != 1){
			this.xyInput[0].value = "";
			this.xyInput[1].value = "";
			return;
		}
		this.updateInputXY(inputHandler);
	};

	UIManager.prototype.updateShapePropertyView = function(){
		var sceneManager = this.sceneManager;
		if ((sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE || 
			sceneManager.state == sceneManager.STATE_SHAPE_EDIT_MODE) && 
			sceneManager.selectedShapes.length > 0){
			$("#shape_properties").show();

			if(sceneManager.selectedShapes.length == 1){
				this.shapeProperties[0].disabled = false;
				this.shapeProperties[0].value = sceneManager.selectedShapes[0].density;
				this.shapeProperties[1].value = sceneManager.selectedShapes[0].friction;
				this.shapeProperties[2].value = sceneManager.selectedShapes[0].restitution;
				this.shapeProperties[3].checked = sceneManager.selectedShapes[0].isSensor;
				this.shapeProperties[4].disabled = false; 
			}
			else {
				this.shapeProperties[0].value = "";
				this.shapeProperties[0].disabled = true;
				this.shapeProperties[1].value = "";
				this.shapeProperties[2].value = "";
				this.shapeProperties[4].disabled = true;

				var allAreSensor = false; 
				for (var i = 0; i < sceneManager.selectedShapes.length; i++){
					if (allAreSensor != sceneManager.selectedShapes[i].isSensor && i != 0){
						allAreSensor = false;
						break;
					}
					else {
						allAreSensor = sceneManager.selectedShapes[i].isSensor;
					}
				}
				this.shapeProperties[3].checked = allAreSensor;
			}
		}
		else {
			// hide this view
			$("#shape_properties").hide();
		}
	};

	UIManager.prototype.updateBodyPropertyView = function(){
		var sceneManager = this.sceneManager;
		if ((sceneManager.state == sceneManager.STATE_DEFAULT_MODE || 
			sceneManager.state == sceneManager.STATE_BODY_EDIT_MODE) && 
			sceneManager.selectedBodies.length > 0){
			$("#body_properties").show();

			if(sceneManager.selectedBodies.length == 1){
				this.bodyProperties[0].disabled = false;
				this.bodyProperties[0].value = sceneManager.selectedBodies[0].name;
				this.bodyProperties[1].value = sceneManager.selectedBodies[0].userData;
				this.bodyProperties[2].checked = sceneManager.selectedBodies[0].isBullet;
				this.bodyProperties[2].checked = sceneManager.selectedBodies[0].isFixedRotation;
				this.bodyProperties[4].disabled = false;
				this.bodyProperties[12].value = sceneManager.selectedBodies[0].bodyType;

				if (sceneManager.selectedBodies[0].sprite != null){
					this.bodyProperties[6].value = sceneManager.selectedBodies[0].getSpriteWidth();
					this.bodyProperties[7].value = sceneManager.selectedBodies[0].getSpriteHeight();
					this.bodyProperties[8].value = sceneManager.selectedBodies[0].getSpriteOffsetX() != null ? sceneManager.selectedBodies[0].getSpriteOffsetX() : "-";
					this.bodyProperties[9].value = sceneManager.selectedBodies[0].getSpriteOffsetY() != null ? sceneManager.selectedBodies[0].getSpriteOffsetY() : "-";
					this.bodyProperties[10].value = sceneManager.selectedBodies[0].getSpriteSourceWidth() != null ? sceneManager.selectedBodies[0].getSpriteSourceWidth() : "-";
					this.bodyProperties[11].value = sceneManager.selectedBodies[0].getSpriteSourceHeight() != null ? sceneManager.selectedBodies[0].getSpriteSourceHeight() : "-";
				}
				else {
					this.bodyProperties[6].value = "";
					this.bodyProperties[7].value = "";
					this.bodyProperties[8].value = "";
					this.bodyProperties[9].value = "";
					this.bodyProperties[10].value = "";
					this.bodyProperties[11].value = "";
				}

			}
			else {
				this.bodyProperties[0].disabled = true;
				this.bodyProperties[0].value = "";
				this.bodyProperties[1].value = "";
				this.bodyProperties[4].disabled = true;

				var allAreBullet = false, allHaveFixedRotation = false, allHaveSameBodyType = 0; 
				for (var i = 0; i < sceneManager.selectedBodies.length; i++){
					if (allAreBullet != sceneManager.selectedBodies[i].isBullet && i != 0){
						allAreBullet = false;
						break;
					}
					else {
						allAreBullet = sceneManager.selectedBodies[i].isBullet;
					}
				}
				for (var i = 0; i < sceneManager.selectedBodies.length; i++){
					if (allAreBullet != sceneManager.selectedBodies[i].isFixedRotation && i != 0){
						allHaveFixedRotation = false;
						break;
					}
					else {
						allHaveFixedRotation = sceneManager.selectedBodies[i].isFixedRotation;
					}
				}
				for (var i = 0; i < sceneManager.selectedBodies.length; i++){
					if (allHaveSameBodyType != sceneManager.selectedBodies[i].bodyType && i != 0){
						allHaveSameBodyType = 3;
						break;
					}
					else {
						allHaveSameBodyType = sceneManager.selectedBodies[i].bodyType;
					}
				}
				this.bodyProperties[2].checked = allAreBullet;
				this.bodyProperties[3].checked = allHaveFixedRotation;
				this.bodyProperties[12].value = allHaveSameBodyType;

				this.bodyProperties[6].value = "";
				this.bodyProperties[7].value = "";
				this.bodyProperties[8].value = "";
				this.bodyProperties[9].value = "";
			}
		}
		else {
			// hide this view
			$("#body_properties").hide();
		}
	};

	UIManager.prototype.updateJointPropertyView = function(){
		var sceneManager = this.sceneManager;
		if (sceneManager.state == sceneManager.STATE_DEFAULT_MODE && 
			sceneManager.selectedJoints.length > 0){
			$("#joint_properties").show();
			var jointNames = ["Distance", "Weld", "Revolute", "Wheel"];
			if(sceneManager.selectedJoints.length == 1){
				$(this.jointPropertyRows[2]).find("p")[1].innerHTML = jointNames[sceneManager.selectedJoints[0].jointType]; 
				$(this.jointPropertyRows[this.jointPropertyRows.length - 1]).show();

				this.jointProperties[0].disabled = false;
				this.jointProperties[0].value = sceneManager.selectedJoints[0].name;
				this.jointProperties[1].value = sceneManager.selectedJoints[0].userData;
				this.jointProperties[2].checked = sceneManager.selectedJoints[0].collideConnected;

				// distance or wheel joint
				if (sceneManager.selectedJoints[0].jointType == 0 || sceneManager.selectedJoints[0].jointType == 3){
					$(this.jointPropertyRows[4]).show();
					$(this.jointPropertyRows[5]).show();
					this.jointProperties[3].value = sceneManager.selectedJoints[0].frequencyHZ;
					this.jointProperties[4].value = sceneManager.selectedJoints[0].dampingRatio;
				}
				else {
					$(this.jointPropertyRows[4]).hide();
					$(this.jointPropertyRows[5]).hide();
				}

				// revolute or wheel joint
				if (sceneManager.selectedJoints[0].jointType == 2 || sceneManager.selectedJoints[0].jointType == 3){
					$(this.jointPropertyRows[6]).show();
					$(this.jointPropertyRows[7]).show();
					$(this.jointPropertyRows[8]).show();
					this.jointProperties[5].checked = sceneManager.selectedJoints[0].enableMotor;
					this.jointProperties[6].value = sceneManager.selectedJoints[0].motorSpeed;
					this.jointProperties[7].value = sceneManager.selectedJoints[0].maxMotorTorque;
				}
				else {
					$(this.jointPropertyRows[6]).hide();
					$(this.jointPropertyRows[7]).hide();
					$(this.jointPropertyRows[8]).hide();	
				}

				// revolute joint
				if (sceneManager.selectedJoints[0].jointType == 2){
					$(this.jointPropertyRows[9]).show();
					$(this.jointPropertyRows[10]).show();
					$(this.jointPropertyRows[11]).show();
					this.jointProperties[8].checked = sceneManager.selectedJoints[0].enableLimit;
					// this.jointProperties[9].value = sceneManager.selectedJoints[0].lowerAngle;
					// this.jointProperties[10].value = sceneManager.selectedJoints[0].upperAngle;
					$(this.jointPropertyRows[10]).find("p")[1].innerHTML = sceneManager.selectedJoints[0].lowerAngle;
					$(this.jointPropertyRows[11]).find("p")[1].innerHTML = sceneManager.selectedJoints[0].upperAngle;
				}
				else {
					$(this.jointPropertyRows[9]).hide();
					$(this.jointPropertyRows[10]).hide();
					$(this.jointPropertyRows[11]).hide();	
				}
			}
			else {
				this.jointProperties[0].disabled = true;
				this.jointProperties[0].value = "";
				this.jointProperties[1].value = "";
				$(this.jointPropertyRows[2]).find("p")[1].innerHTML = ""; 
				for (var i = 4; i < this.jointPropertyRows.length; i++){
					$(this.jointPropertyRows[i]).hide();
				}
			}
		}
		else {
			// hide this view
			$("#joint_properties").hide();
		}
	};

	// update input-xy whenever an object is selected / moved 
	UIManager.prototype.updateInputXY = function(inputHandler){
		if (inputHandler.transformTool == 5){
			if (this.sceneManager.state != this.sceneManager.STATE_SHAPE_EDIT_MODE){
				this.xyInput[0].value = inputHandler.selection[0].scaleXY[0].toFixed(2);
				this.xyInput[1].value = inputHandler.selection[0].scaleXY[1].toFixed(2);
			}
			else {
				this.xyInput[0].value = "";
				this.xyInput[1].value = "";
			}
		}
		else if (inputHandler.transformTool == 7){
			if (this.sceneManager.state == this.sceneManager.STATE_SHAPE_EDIT_MODE){
				if (inputHandler.selection.length == 1 && inputHandler.selection[0].x){
					this.xyInput[0].value = inputHandler.selection[0].x.toFixed(2);
					this.xyInput[1].value = inputHandler.selection[0].y.toFixed(2);
				}
			}
			else {
				if (inputHandler.selection[0].position){
					this.xyInput[0].value = inputHandler.selection[0].position[0].toFixed(2);
					this.xyInput[1].value = inputHandler.selection[0].position[1].toFixed(2);
				}
			}
		}
		else if (inputHandler.transformTool == 6){
			if (this.sceneManager.state != this.sceneManager.STATE_SHAPE_EDIT_MODE && inputHandler.selection[0].rotation){
				this.xyInput[0].value = inputHandler.selection[0].rotation.toFixed(2);
				this.xyInput[1].value = "";
			}
			else {
				this.xyInput[0].value = "";
				this.xyInput[1].value = "";
			}	
		}
	};

	// binds custom object methods to dom events
	function mixin(target, source, methods){
		for (var ii = 2, ll = arguments.length; ii < ll; ii++){
			var method = arguments[ii];
			target[method] = source[method].bind(source);
		}
	}

	var instance;
	return{
		getInstance: function(sceneManager){
			if (instance == null){
				instance = new UIManager(sceneManager);
				instance.constructor = null;
			}
			return instance;
		}
	};

})();