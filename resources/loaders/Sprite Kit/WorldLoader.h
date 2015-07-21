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

#ifndef HelloKit_b2WorldLoader_h
#define HelloKit_b2WorldLoader_h

#import <SpriteKit/SpriteKit.h> // for creating physics objects

// jsonKit can be dowloaded from : https://github.com/johnezang/JSONKit
#import "JSONKIT.h"             // for parsing json scene

enum ShapeTypes{
    SHAPE_BOX,
    SHAPE_CIRCLE,
    SHAPE_POLYGON,
    SHAPE_CHAIN
};

/*
 
 Joint loading is unpredictable as sprite kit does not support
 many features included in box2d like separate anchor for revolute 
 joint(pin joint in sprite kit), enabling and disabling motor in pin joints, etc.
 
*/
enum JointTypes{
    JOINT_DISTANCE,     // created as spring joint
    JOINT_WELD,         // created as fixed joint
    JOINT_REVOLUTE,     // created as pin joint
    JOINT_WHEEL,        // not supported by sprite kit
    JOINT_PULLEY,       // not supported by sprite kit
    JOINT_GEAR,         // not supported by sprite kit
    JOINT_PRISMATIC,    // not supported by sprite kit
    JOINT_ROPE          // created as limit joint
};

@interface WorldLoader : NSObject

// to offset the world's position
@property float offsetX, offsetY;

// loadedBodies contains all the bodies loaded (SKPhysicsBody*)
// loadedJoints contains all the joints loaded (SKPhysicsJoints*)
@property NSMutableArray *loadedBodies, *loadedJoints;

+(id) init;
// to reset loader for loading new scene, called everytime a new scene is loaded
-(void) reset;
// loads the physics scene present in file
-(void) loadJsonSceneFromFile : (NSString*)file : (SKScene*)scene;
// loads fixtures present in bodies, also initializes parent node's physicsBody 
-(void) loadJsonFixtures : (NSArray*)jsonFixtures : (SKNode*) parent;

@end

#endif
