var UIManager = (function(){

	function UIManager(sceneManager){
		this.sceneManager 	 	= sceneManager;
		this.xyInput         	= [];
		this.taskbar         	= [];
		this.viewControls    	= [];
		this.playBackControls 	= [];
		this.shapeProperties 	= [];			// density, friction, restitution, isSensor, edit	
		this.bodyProperties  	= [];			// name, userdata, type, isBullet, edit, tex_file, tex_width, tex_height
		this.jointProperties 	= [];			// name, userdata, type, collideConnected, joint_specific_parameters
		this.jointPropertyRows 	= [];
	}

	UIManager.prototype.initialize = function(inputHandler){
		var sceneManager = this.sceneManager;

		// hide separators
		var elementsToHide = document.getElementsByClassName("separator");
		for (var i = 0; i < elementsToHide.length; i++){
			elementsToHide[i].style.visibility = "hidden";
		}

		// hide alert dialog box
		var alertDialog = $("#alert_dialog");
		alertDialog.hide();
		var alertButtons = alertDialog.find("button");
		alertButtons[0].addEventListener("click", function(){
			alertDialog.hide();
			var data = new Blob([JSON.stringify(sceneManager.saveScene(), null, 4)], {type:'text/plain'});
			var textFile = window.URL.createObjectURL(data);
			window.open(textFile);
			sceneManager.newScene();
		});
		alertButtons[1].addEventListener("click", function(){
			alertDialog.hide();
			sceneManager.newScene();
		});
		alertButtons[2].addEventListener("click", function(){
			alertDialog.hide();
		});

		// hide auto shape option view
		var autoShape = $("#auto_shape");
		autoShape.hide();
		var shapeButtons = autoShape.find("button");
		shapeButtons[0].addEventListener("click", function(){
			$('#loadBitmap')[0].value = null;
			$("#loadBitmap").trigger('click');
			autoShape.hide();
		});
		shapeButtons[1].addEventListener("click", function(){
			autoShape.hide();
		});
		$('#loadBitmap').change(function(e){
			if (e.target.files.length < 0){
				return;
			}
			if(e.target.files[0].name && e.target.files[0].type == "image/bmp"){
				var reader =  new FileReader();
				reader.readAsBinaryString(e.target.files[0]);
				reader.onload =  function(e){
					var loader = new BMPImageLoader();
					var image = loader.loadBMP(e.target.result);

					// default settings
					var xSpace = Editor.autoTrace.xSpace,
					 	ySpace = Editor.autoTrace.ySpace, 
					 	dataWidth = parseInt(image.width / xSpace), 
					 	dataHeight = parseInt(image.height / ySpace), 
					 	alphaThreshold = 127, 
					 	concavity = Editor.autoTrace.concavity;
					var points = [];
					for (var i = 0; i < dataHeight; i++){
						for (var j = 0; j < dataWidth; j++){
							var pixel = image.getPixelAt(j * xSpace, i * ySpace);
							if ((pixel[0]) >= alphaThreshold){
								points.push([j * xSpace - image.width / 2 , i * ySpace - image.height / 2]);
							}
						}
					}
					// create concave hull from points
					var concaveHull = hull(points, concavity);
					delete points;

					// create shape
					sceneManager.createShapeFromPoints(concaveHull);

					delete concaveHull;

					// release image
					image.dispose();
					delete image;
				}
			}
		});

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

			// mixin(this, sceneManager, action);
			
			this.addEventListener("click", function(e){
				e.preventDefault();
				if (action == 'newScene'){
					alertDialog.show();
					return;
				}
				else if (action == 'loadScene'){
					$('#loadScene')[0].value = null;
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
		$('#editMenu').find("a")[0].addEventListener("click", function(e){
			sceneManager.deleteSelectedObjects();
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
					if (params % 10 != 2){
						e.target["createShape"](shapeType, params % 10);
					}
					else {
						autoShape.show();
					}
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
		for (var i = 0; i < 6; i++){
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
		$(this.shapeProperties[6]).change(function(){
			for (var i = 0; i < sceneManager.selectedShapes.length; i++){
				var property = $(this).data('property');
				sceneManager.selectedShapes[i][property] = $(this).is(":checked");
			}
		});
		var ref = this;
		this.shapeProperties[7].addEventListener('click', function(){
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
		for (var i = 4; i < 6; i++){
			this.bodyProperties[i].addEventListener('keypress', function(e){
				if (e.which == 13){
					var property = $(this).data('property');
					for (var i = 0; i < sceneManager.selectedBodies.length; i++){
						if (parseFloat(this.value) != NaN)
							sceneManager.selectedBodies[i][property] = parseFloat(this.value);
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
		this.bodyProperties[6].addEventListener('click', function(){
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
		$(this.bodyProperties[14]).change(function(){
			for (var i = 0; i < sceneManager.selectedBodies.length; i++){
				var property = $(this).data('property');
				sceneManager.selectedBodies[i][property] = parseInt(this.value);
			}
		});
		this.bodyProperties[7].addEventListener("click", function(e){
			this.value = null;
		});
		$(this.bodyProperties[7]).change(function(e){
			// console.log(e.target.files[0].type);
			if (e.target.files == null && e.target.files.length < 0){
				return;
			}
			if(e.target.files[0].name && (e.target.files[0].type == "image/png" ||  e.target.files[0].type == "image/jpeg" || e.target.files[0].type == "image/bmp")){
				for (var i = 0; i < sceneManager.selectedBodies.length; i++){
					sceneManager.selectedBodies[i].setSprite(Editor.resourceDirectory + e.target.files[0].name);
				}
			}
		});
		for (var i = 8; i < 14; i++){
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
					for (var j = 0; j < sceneManager.selectedJoints.length; j++){
						var property = $(this).data('property');
						if (i < 2){
							sceneManager.selectedJoints[j][property] = this.value;
						}
						else {
							if (parseFloat(this.value) != null){
								sceneManager.selectedJoints[j][property] = parseFloat(this.value);
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
				this.shapeProperties[3].value = sceneManager.selectedShapes[0].maskBits;
				this.shapeProperties[4].value = sceneManager.selectedShapes[0].categoryBits;
				this.shapeProperties[5].value = sceneManager.selectedShapes[0].groupIndex;
				this.shapeProperties[6].checked = sceneManager.selectedShapes[0].isSensor;
				this.shapeProperties[7].disabled = false; 
			}
			else {
				this.shapeProperties[0].value = "";
				// this.shapeProperties[0].disabled = true;
				this.shapeProperties[1].value = "";
				this.shapeProperties[6].value = "";
				this.shapeProperties[7].disabled = true;

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
				var cachedBody = sceneManager.selectedBodies[0];
				this.bodyProperties[0].disabled = false;
				this.bodyProperties[0].value = cachedBody.name;
				this.bodyProperties[1].value = cachedBody.userData;
				this.bodyProperties[2].checked = cachedBody.isBullet;
				this.bodyProperties[3].checked = cachedBody.isFixedRotation;
				this.bodyProperties[4].value = cachedBody.linearDamping;
				this.bodyProperties[5].value = cachedBody.angularDamping;
				this.bodyProperties[6].disabled = false;
				this.bodyProperties[14].value = cachedBody.bodyType;

				if (cachedBody.sprite != null){
					this.bodyProperties[8].value = cachedBody.getSpriteWidth();
					this.bodyProperties[9].value = cachedBody.getSpriteHeight();
					this.bodyProperties[10].value = cachedBody.getSpriteSourceWidth() != null ? cachedBody.getSpriteSourceWidth() : "-";
					this.bodyProperties[11].value = cachedBody.getSpriteSourceHeight() != null ? cachedBody.getSpriteSourceHeight() : "-";
					this.bodyProperties[12].value = cachedBody.getSpriteOffsetX() != null ? cachedBody.getSpriteOffsetX() : "-";
					this.bodyProperties[13].value = cachedBody.getSpriteOffsetY() != null ? cachedBody.getSpriteOffsetY() : "-";	
				}
				else {
					this.bodyProperties[8].value = "";
					this.bodyProperties[9].value = "";
					this.bodyProperties[10].value = "";
					this.bodyProperties[11].value = "";
					this.bodyProperties[12].value = "";
					this.bodyProperties[13].value = "";
				}

			}
			else {
				this.bodyProperties[0].disabled = true;
				this.bodyProperties[0].value = "";
				this.bodyProperties[1].value = "";
				this.bodyProperties[4].value = "";
				this.bodyProperties[5].value = "";
				this.bodyProperties[6].disabled = true;

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
					if (allHaveFixedRotation != sceneManager.selectedBodies[i].isFixedRotation && i != 0){
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
				this.bodyProperties[14].value = allHaveSameBodyType;

				this.bodyProperties[8].value = "";
				this.bodyProperties[9].value = "";
				this.bodyProperties[10].value = "";
				this.bodyProperties[11].value = "";
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
			var jointNames = ["Distance", "Weld", "Revolute", "Wheel", "Pulley", "Gear", "Prismatic", "Rope"];
			if(sceneManager.selectedJoints.length == 1){
				var cachedJoint = sceneManager.selectedJoints[0];
				$(this.jointPropertyRows[2]).find("p")[1].innerHTML = jointNames[cachedJoint.jointType]; 
				$(this.jointPropertyRows[this.jointPropertyRows.length - 1]).show();

				this.jointProperties[0].disabled = false;
				this.jointProperties[0].value = cachedJoint.name;
				this.jointProperties[1].value = cachedJoint.userData;
				this.jointProperties[2].checked = cachedJoint.collideConnected;

				// distance or wheel joint
				if (cachedJoint.jointType == 0 || cachedJoint.jointType == 3){
					$(this.jointPropertyRows[4]).find("p")[0].innerHTML = "Frequency Hz";
					$(this.jointPropertyRows[4]).show();
					$(this.jointPropertyRows[5]).show();
					this.jointProperties[3].value = cachedJoint.frequencyHZ;
					this.jointProperties[4].value = cachedJoint.dampingRatio;
				}
				else {
					$(this.jointPropertyRows[4]).hide();
					$(this.jointPropertyRows[5]).hide();
				}

				// pulley, gear or rope joint
				if (cachedJoint.jointType == 4 || cachedJoint.jointType == 5 || cachedJoint.jointType == 7){
					if (cachedJoint.jointType == 7){
						$(this.jointPropertyRows[4]).find("p")[0].innerHTML = "Max Length";
					}
					else{
						$(this.jointPropertyRows[4]).find("p")[0].innerHTML = "Ratio";
					}
					this.jointProperties[3].value = cachedJoint.frequencyHZ.toFixed(3);
					$(this.jointPropertyRows[4]).show();
				}


				// revolute, wheel joint or prismatic joint
				if (cachedJoint.jointType == 2 || cachedJoint.jointType == 3 || cachedJoint.jointType == 6){
					$(this.jointPropertyRows[6]).show();
					$(this.jointPropertyRows[7]).show();
					$(this.jointPropertyRows[8]).show();
					if (cachedJoint.jointType == 6){
						$(this.jointPropertyRows[8]).find("p")[0].innerHTML = "Max Motor Force"
					}
					else {
						$(this.jointPropertyRows[8]).find("p")[0].innerHTML = "Max Motor Torque"	
					}
					this.jointProperties[5].checked = cachedJoint.enableMotor;
					this.jointProperties[6].value = cachedJoint.motorSpeed;
					this.jointProperties[7].value = cachedJoint.maxMotorTorque;
				}
				else {
					$(this.jointPropertyRows[6]).hide();
					$(this.jointPropertyRows[7]).hide();
					$(this.jointPropertyRows[8]).hide();	
				}

				// revolute joint
				if (cachedJoint.jointType == 2 || cachedJoint.jointType == 6){
					this.jointProperties[8].checked = cachedJoint.enableLimit;
					if (cachedJoint.jointType == 2){
						$(this.jointPropertyRows[10]).find("p")[0].innerHTML = "Lower Angle";
						$(this.jointPropertyRows[11]).find("p")[0].innerHTML = "Upper Angle";
						$(this.jointPropertyRows[10]).find("p")[1].innerHTML = cachedJoint.lowerAngle.toFixed(3);
						$(this.jointPropertyRows[11]).find("p")[1].innerHTML = cachedJoint.upperAngle.toFixed(3);
					}
					else {
						$(this.jointPropertyRows[10]).find("p")[0].innerHTML = "Lower Translation";
						$(this.jointPropertyRows[11]).find("p")[0].innerHTML = "Upper Translation";
						$(this.jointPropertyRows[10]).find("p")[1].innerHTML = cachedJoint.lowerTranslation.toFixed(3);
						$(this.jointPropertyRows[11]).find("p")[1].innerHTML = cachedJoint.upperTranslation.toFixed(3);	
					}
					$(this.jointPropertyRows[9]).show();
					$(this.jointPropertyRows[10]).show();
					$(this.jointPropertyRows[11]).show();
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