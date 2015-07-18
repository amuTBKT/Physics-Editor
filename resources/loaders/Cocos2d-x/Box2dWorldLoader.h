#pragma once

/*
Author: Amit Kumar Mehar

This software is provided 'as-is', without any express or implied
warranty.  In no event will the authors be held liable for any damages
arising from the use of this software.
Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:
1. The origin of this software must not be misrepresented; you must not
claim that you wrote the original software. If you use this software
in a product, an acknowledgment in the product documentation would be
appreciated but is not required.
2. Altered source versions must be plainly marked as such, and must not be
misrepresented as being the original software.
3. This notice may not be removed or altered from any source distribution.
*/

#include <cocos2d.h>			// for file loading only
#include <Box2D\Box2D.h>		// for creating physics objects
#include <vector>
#include <json\document.h>		// for parsing json file

#define PTM_RATIO 30.0			// pixel to meter ratio

class Box2dWorldLoader
{
private:
	// shape types used by the parser
	enum ShapeTypes{
		SHAPE_BOX, 
		SHAPE_CIRCLE,
		SHAPE_POLYGON,
		SHAPE_CHAIN
	};
	// joint type used by the parser
	enum JointTypes {
		JOINT_DISTANCE,
		JOINT_WELD,
		JOINT_REVOLUTE,
		JOINT_WHEEL,
		JOINT_PULLEY,
		JOINT_GEAR,
		JOINT_PRISMATIC,
		JOINT_ROPE
	};

	// to offset world's position (in pixels)
	float offsetX, offsetY;
	
	// vector to store loaded bodies, necessary to load joints (keep track of bodyA and bodyB, as used by joints)
	std::vector<b2Body*> loadedBodies;
	// vector to store loaded joints, necessary to create gear joints (keep track of joint1 and joint2, as used by it)
	std::vector<b2Joint*> loadedJoints;

	// reset the object to load new scene
	void reset(){
		offsetX = offsetY = 0;

		if (loadedBodies.size() > 0){
			loadedBodies.clear();
		}
		if (loadedJoints.size() > 0){
			loadedJoints.clear();
		}
	}

	// to load bodies
	void loadBodies(rapidjson::Value &, b2World *);
	// to load fixtures
	std::vector<b2FixtureDef*> loadJsonFixture(rapidjson::Value &);
	// to load joints
	void loadJoints(rapidjson::Value &, b2World *);
public:
	Box2dWorldLoader();
	~Box2dWorldLoader();
	void loadJsonScene(const char*, b2World *);
	void setOffset(float, float);
	std::vector<b2Body*> getLoadedBodies();
	std::vector<b2Joint*> getLoadedJoints();
};

