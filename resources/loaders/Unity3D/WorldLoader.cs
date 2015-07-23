using UnityEngine;
using System.Collections;
using System.Collections.Generic;	// for List<>
using SimpleJSON;					// for parsing json file

public class WorldLoader : MonoBehaviour{

	/** meter to pixel ratio */
	public float RATIO = 30;

	/** scene to load, file must be present in resources folder **/
	public Object scene;

	private enum ShapeTypes {
		SHAPE_BOX,			// BoxCollider2D
		SHAPE_CIRCLE,		// CircleCollider2D
		SHAPE_POLYGON,		// PolygonCollider2D
		SHAPE_CHAIN			// EdgeCollider2D
	};
	private enum JointTypes {
		JOINT_DISTANCE,		// created as DistanceJoint2D
		JOINT_WELD,			// not supported
		JOINT_REVOLUTE,		// created as HingeJoint2D
		JOINT_WHEEL,		// created as WheelJoint2D
		JOINT_PULLEY,		// not supported
		JOINT_GEAR, 		// not supported
		JOINT_PRISMATIC,	// created as SliderJoint2D 
		JOINT_ROPE			// created as DistanceJoint2D
	};

	// list of loaded gameobjects
	[SerializeField]	// so that entering play mode does not screw up "delete scene" feature 
	[HideInInspector]	// so that user does not screw with loaded objects
	private List<GameObject> loadedObjects;

	// list of loaded joints
	[SerializeField] 
	[HideInInspector]
	private List<Joint2D> loadedJoints;

	// resets loader to load new scene
	public void reset(){
		if (loadedObjects != null){
			loadedObjects.Clear();
			loadedObjects = null;
		}
		loadedObjects = new List<GameObject>();

		if (loadedJoints != null){
			loadedJoints.Clear();
			loadedJoints = null;
		}
		loadedJoints = new List<Joint2D>();
	}

	public List<GameObject> getLoadedObjects(){
		return loadedObjects;
	}

	public List<Joint2D> getLoadedJoints(){
		return loadedJoints;
	}

	public void loadJsonScene(){
		reset();
	
		// load file
		TextAsset file = (TextAsset) Resources.Load(scene.name);
		// parse json file to scene
		JSONNode jsonScene = JSON.Parse(file.text);

		// load bodies
		JSONNode jsonBodies = jsonScene["bodies"];
		loadJsonBodies(jsonBodies);

		// load joints
		JSONNode jsonJoints = jsonScene["joints"];
		loadJsonJoints(jsonJoints);
	}

	void loadJsonJoints(JSONNode jsonJoints){
		int JointCount = 0;

		for (int i = 0, numberOfJoints = jsonJoints.Count; i < numberOfJoints; i++){
			JSONNode jsonJoint = jsonJoints[i];
			int jointType = jsonJoint["jointType"].AsInt;

			GameObject bodyA = loadedObjects[jsonJoint["bodyA"].AsInt];
			GameObject bodyB = loadedObjects[jsonJoint["bodyB"].AsInt];

			JSONNode localAnchorA = jsonJoint["localAnchorA"];
			Vector2 anchorA = new Vector2(localAnchorA[0].AsFloat / RATIO, -localAnchorA[1].AsFloat / RATIO);
			JSONNode localAnchorB = jsonJoint["localAnchorB"];
			Vector2 anchorB = new Vector2(localAnchorB[0].AsFloat / RATIO, -localAnchorB[1].AsFloat / RATIO);
			bool collideConnected = jsonJoint["collideConnected"].AsBool;
			string userData = jsonJoint["userData"].Value;

			if (jointType == (int) JointTypes.JOINT_DISTANCE || jointType == (int) JointTypes.JOINT_ROPE){
				DistanceJoint2D joint = bodyA.AddComponent<DistanceJoint2D>();
				joint.connectedBody = bodyB.GetComponent<Rigidbody2D>();
				joint.anchor = anchorA;
				joint.connectedAnchor = anchorB;

				// distance joint
				if (jsonJoint["length"] != null){
					joint.distance = jsonJoint["length"].AsFloat / RATIO;
					joint.maxDistanceOnly = true;
				}
				// rope joint
				else if (jsonJoint["maxLength"] != null){
					joint.distance = jsonJoint["maxLength"].AsFloat / RATIO;
				}

				joint.enableCollision = collideConnected;
				joint.name += '_';
				joint.name += userData.Length > 0 ? userData : "joint" + JointCount++;
			}
			else if (jointType == (int) JointTypes.JOINT_REVOLUTE){
				HingeJoint2D joint = bodyA.AddComponent<HingeJoint2D>();
				joint.connectedBody = bodyB.GetComponent<Rigidbody2D>();
				joint.anchor = anchorA;
				joint.connectedAnchor = anchorB;
				joint.enableCollision = collideConnected;
				joint.name += '_';
				joint.name += userData.Length > 0 ? userData : "joint" + JointCount++;

				// limits are not working properly 
				bool enableLimits = jsonJoint["enableLimit"].AsBool;
				float referenceAngle = -jsonJoint["referenceAngle"].AsFloat;
				float angleBetweenBodies = Mathf.Atan2(bodyB.transform.position.y - bodyA.transform.position.y,
				                                      bodyB.transform.position.x - bodyA.transform.position.x) * 180 / Mathf.PI;
				float upperAngle = -jsonJoint["lowerAngle"].AsFloat;
				float lowerAngle = -jsonJoint["upperAngle"].AsFloat;
				bool enableMotor = jsonJoint["enableMotor"].AsBool;
				float motorSpeed = -jsonJoint["motorSpeed"].AsFloat;
				float maxMotorTorque = jsonJoint["maxMotorTorque"].AsFloat;

				joint.useLimits = enableLimits;
				JointAngleLimits2D limits = new JointAngleLimits2D();
				limits.max = angleBetweenBodies + upperAngle;
				limits.min = angleBetweenBodies + lowerAngle;
				joint.limits = limits;
				joint.useMotor = enableMotor;
				JointMotor2D motor = new JointMotor2D();
				motor.maxMotorTorque = maxMotorTorque;
				motor.motorSpeed = motorSpeed;
				joint.motor = motor;
			}
			else if (jointType == (int) JointTypes.JOINT_WHEEL){
				WheelJoint2D joint = bodyA.AddComponent<WheelJoint2D>();
				joint.connectedBody = bodyB.GetComponent<Rigidbody2D>();
				joint.anchor = anchorA;
				joint.connectedAnchor = anchorB;
				joint.enableCollision = collideConnected;
				joint.name += '_';
				joint.name += userData.Length > 0 ? userData : "joint" + JointCount++;

				bool enableMotor = jsonJoint["enableMotor"].AsBool;
				float motorSpeed = -jsonJoint["motorSpeed"].AsFloat;
				float maxMotorTorque = jsonJoint["maxMotorTorque"].AsFloat;
				float dampingRatio = jsonJoint["dampingRatio"].AsFloat;
				float frequency = jsonJoint["frequencyHZ"].AsFloat;
				JSONNode localAxisA = jsonJoint["localAxisA"];
				float angle = Mathf.Atan2(-localAxisA[1].AsFloat, localAxisA[0].AsFloat) * 180 / Mathf.PI;

				joint.useMotor = enableMotor;
				JointMotor2D motor = new JointMotor2D();
				motor.maxMotorTorque = maxMotorTorque;
				motor.motorSpeed = motorSpeed;
				joint.motor = motor;

				JointSuspension2D suspension = new JointSuspension2D();
				suspension.dampingRatio = dampingRatio;
				suspension.frequency = frequency;
				suspension.angle = angle;
				joint.suspension = suspension;
			}
			else if (jointType == (int) JointTypes.JOINT_PRISMATIC){
				SliderJoint2D joint = bodyA.AddComponent<SliderJoint2D>();
				joint.connectedBody = bodyB.GetComponent<Rigidbody2D>();
				joint.anchor = anchorA;
				joint.connectedAnchor = anchorB;
				joint.enableCollision = collideConnected;
				joint.name += '_';
				joint.name += userData.Length > 0 ? userData : "joint" + JointCount++;
				
				bool enableLimits = jsonJoint["enableLimit"].AsBool;
				float referenceAngle = -jsonJoint["referenceAngle"].AsFloat;
				float upperTranslation = jsonJoint["upperTranslation"].AsFloat / RATIO;
				float lowerTranslation = jsonJoint["lowerTranslation"].AsFloat / RATIO;
				bool enableMotor = jsonJoint["enableMotor"].AsBool;
				float motorSpeed = -jsonJoint["motorSpeed"].AsFloat;
				float maxMotorTorque = jsonJoint["maxMotorTorque"].AsFloat;
				JSONNode localAxisA = jsonJoint["localAxisA"];
				float angle = Mathf.Atan2(-localAxisA[1].AsFloat, localAxisA[0].AsFloat) * 180 / Mathf.PI;

				joint.useLimits = enableLimits;
				JointTranslationLimits2D limits = new JointTranslationLimits2D();
				limits.max = upperTranslation;
				limits.min = lowerTranslation;
				joint.limits = limits;
				joint.useMotor = enableMotor;
				JointMotor2D motor = new JointMotor2D();
				motor.maxMotorTorque = maxMotorTorque;
				motor.motorSpeed = motorSpeed;
				joint.motor = motor;
				joint.angle = angle;
			}
		}
	}

	void loadJsonBodies(JSONNode jsonBodies){
		int BodyCount = 0;

		for (int i = 0, numberOfBodies = jsonBodies.Count; i < numberOfBodies; i++){
			JSONNode jsonBody = jsonBodies[i];
			
			int bodyType = jsonBody["type"].AsInt;
			JSONNode pos = jsonBody["position"];
			Vector3 position = new Vector3(pos[0].AsFloat / RATIO, -pos[1].AsFloat / RATIO, 0);
			float rotation = -jsonBody["rotation"].AsFloat;
			float linearDamping = jsonBody["linearDamping"].AsFloat;
			float angularDamping = jsonBody["angularDamping"].AsFloat;
			string userData = jsonBody["userData"].Value;
			bool isFixedRotation = jsonBody["isFixedRotation"].AsBool;
			bool isBullet = jsonBody["isBullet"].AsBool;
			
			
			GameObject body = new GameObject(userData.Length > 0 ? userData : "body" + BodyCount++);
			body.transform.position = position;
			body.transform.rotation = Quaternion.Euler(0, 0, rotation);
			body.AddComponent<DebugRenderer>();
			
			float density = 0;
			List<Fixture> fixtures = loadJsonFixtures(jsonBody["fixtures"]);
			for (int j = 0, numberOfFixtures = fixtures.Count; j < numberOfFixtures; j++){
				Fixture fixture = fixtures[j];
				density += fixture.density;
				if (fixture.shapeType == (int) ShapeTypes.SHAPE_BOX){
					BoxCollider2D boxCollider = body.AddComponent<BoxCollider2D>();
					boxCollider.isTrigger = fixture.isTrigger;
					boxCollider.offset = fixture.offset;
					boxCollider.size = fixture.size;
					boxCollider.sharedMaterial = fixture.physicsMaterial;
				}
				else if (fixture.shapeType == (int) ShapeTypes.SHAPE_CIRCLE){
					CircleCollider2D circleCollider = body.AddComponent<CircleCollider2D>();
					circleCollider.isTrigger = fixture.isTrigger;
					circleCollider.offset = fixture.offset;
					circleCollider.radius = fixture.size.x;
					circleCollider.sharedMaterial = fixture.physicsMaterial;
				}
				else if (fixture.shapeType == (int) ShapeTypes.SHAPE_POLYGON){
					PolygonCollider2D polyCollider = body.AddComponent<PolygonCollider2D>();
					polyCollider.isTrigger = fixture.isTrigger;
					polyCollider.offset = fixture.offset;
					polyCollider.SetPath(0, fixture.vertices);
					polyCollider.sharedMaterial = fixture.physicsMaterial;
				}
				else if (fixture.shapeType == (int) ShapeTypes.SHAPE_CHAIN){
					EdgeCollider2D edgeCollider = body.AddComponent<EdgeCollider2D>();
					edgeCollider.isTrigger = fixture.isTrigger;
					edgeCollider.offset = fixture.offset;
					edgeCollider.points = fixture.vertices;
					edgeCollider.sharedMaterial = fixture.physicsMaterial;
				}
			}

			body.AddComponent<Rigidbody2D>();
			Rigidbody2D rigidBody2D = body.GetComponent<Rigidbody2D>();
			rigidBody2D.isKinematic = bodyType == 1 || bodyType == 0;
			rigidBody2D.fixedAngle = isFixedRotation;
			rigidBody2D.mass = density;
			rigidBody2D.angularDrag = angularDamping;
			rigidBody2D.drag = linearDamping;

			if (isBullet){
				rigidBody2D.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
			}
			else {
				rigidBody2D.collisionDetectionMode = CollisionDetectionMode2D.None;
			}

			loadedObjects.Add(body);
		}
	}

	List<Fixture> loadJsonFixtures(JSONNode jsonFixtures){
		List<Fixture> fixtures = new List<Fixture>();

		for (int i = 0, numberOfFixtures = jsonFixtures.Count; i < numberOfFixtures; i++){
			JSONNode jsonFixture = jsonFixtures[i];

			float density = jsonFixture["density"].AsFloat;
			float friction = jsonFixture["friction"].AsFloat;
			float restitution = jsonFixture["restitution"].AsFloat;
			bool isSensor = jsonFixture["isSensor"].AsBool;

			JSONNode jsonShapes = jsonFixture["shapes"];
			for (int j = 0, numberOfShapes = jsonShapes.Count; j < numberOfShapes; j++){
				JSONNode jsonShape = jsonShapes[j];

				JSONNode pos = jsonShape["position"];
				Vector2 position = new Vector2(pos[0].AsFloat / RATIO, -pos[1].AsFloat / RATIO);
				int shapeType = jsonShape["type"].AsInt;

				Fixture fixture = new Fixture();
				fixture.physicsMaterial = new PhysicsMaterial2D();
				fixture.physicsMaterial.friction = friction;
				fixture.physicsMaterial.bounciness = restitution;
				fixture.density = density;

				if (shapeType == (int) ShapeTypes.SHAPE_BOX){
					float width = jsonShape["width"].AsFloat / RATIO;
					float height = jsonShape["height"].AsFloat / RATIO;
					fixture.shapeType = (int) ShapeTypes.SHAPE_BOX;
					fixture.size = new Vector2(width, height);
					fixture.offset = position;
				}
				else if (shapeType == (int) ShapeTypes.SHAPE_CIRCLE){
					float radius = 2 * jsonShape["radius"].AsFloat / RATIO;
					fixture.shapeType = (int) ShapeTypes.SHAPE_CIRCLE;
					fixture.size = new Vector2(radius, radius);
					fixture.offset = position;
				}
				else if (shapeType == (int) ShapeTypes.SHAPE_POLYGON){
					JSONNode jsonVertices = jsonShape["vertices"];
					fixture.vertices = new Vector2[jsonVertices.Count];
					for (int k = 0, numberOfVertices = jsonVertices.Count; k < numberOfVertices; k++){
						fixture.vertices[k] = new Vector2(jsonVertices[k][0].AsFloat / RATIO, 
						                                  -jsonVertices[k][1].AsFloat / RATIO);
					}
					fixture.shapeType = (int) ShapeTypes.SHAPE_POLYGON;
					fixture.offset = position;
				}
				else if (shapeType == (int) ShapeTypes.SHAPE_CHAIN){
					JSONNode jsonVertices = jsonShape["vertices"];
					fixture.vertices = new Vector2[jsonVertices.Count];
					for (int k = 0, numberOfVertices = jsonVertices.Count; k < numberOfVertices; k++){
						fixture.vertices[k] = new Vector2(jsonVertices[k][0].AsFloat / RATIO, 
						                                  -jsonVertices[k][1].AsFloat / RATIO);
					}
					fixture.shapeType = (int) ShapeTypes.SHAPE_CHAIN;
					fixture.offset = position;
				}
				fixture.isTrigger = isSensor;
				fixtures.Add(fixture);
			}

		}

		return fixtures;
	}
}
