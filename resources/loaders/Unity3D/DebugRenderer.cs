using UnityEngine;
using System.Collections;

public class DebugRenderer : MonoBehaviour {

	void OnDrawGizmos(){
		Collider2D[] colliders = GetComponents<Collider2D>();
		for (int i = 0, numberOfColliders = colliders.Length; i < numberOfColliders; i++){
			if ((colliders[i] as BoxCollider2D) != null){
				BoxCollider2D collider = (BoxCollider2D) colliders[i];
				float width = collider.size.x;
				float height = collider.size.y;
				Vector3 position = transform.TransformPoint(new Vector3(collider.offset.x, collider.offset.y, 0));
				UnityEditor.Handles.matrix = Matrix4x4.TRS(position, transform.rotation, transform.localScale);

				Vector3 from = new Vector3(-width / 2, height / 2, 0);
				Vector3 to = new Vector3(width / 2, height / 2);
				UnityEditor.Handles.DrawLine(from, to);

				from = new Vector3(width / 2, height / 2, 0);
				to = new Vector3(width / 2, -height / 2);
				UnityEditor.Handles.DrawLine(from, to);

				from = new Vector3(width / 2, -height / 2, 0);
				to = new Vector3(-width / 2, -height / 2);
				UnityEditor.Handles.DrawLine(from, to);

				from = new Vector3(-width / 2, -height / 2, 0);
				to = new Vector3(-width / 2, height / 2);
				UnityEditor.Handles.DrawLine(from, to);
			}
			else if ((colliders[i] as CircleCollider2D) != null){
				CircleCollider2D collider = (CircleCollider2D) colliders[i];
				float radius = collider.radius;
				Vector3 position = transform.TransformPoint(new Vector3(collider.offset.x, collider.offset.y, 0));
				UnityEditor.Handles.matrix = Matrix4x4.TRS(position, transform.rotation, transform.localScale);
				UnityEditor.Handles.DrawWireDisc(new Vector3(), new Vector3(0, 0, 1), radius);
			}
			else if ((colliders[i] as PolygonCollider2D) != null){
				PolygonCollider2D collider = (PolygonCollider2D) colliders[i];
				Vector2[] vertices = collider.points;
				Vector3 position = transform.TransformPoint(new Vector3(collider.offset.x, collider.offset.y, 0));
				UnityEditor.Handles.matrix = Matrix4x4.TRS(position, transform.rotation, transform.localScale);
				for (int j = 0; j < vertices.Length; j++){
					if (j < vertices.Length - 1){
						Vector3 from = new Vector3(vertices[j].x, vertices[j].y, 0);
						Vector3 to = new Vector3(vertices[j + 1].x, vertices[j + 1].y, 0);
						UnityEditor.Handles.DrawLine(from, to);
					}
					else if (j == vertices.Length - 1){
						Vector3 from = new Vector3(vertices[j].x, vertices[j].y, 0);
						Vector3 to = new Vector3(vertices[0].x, vertices[0].y, 0);
						UnityEditor.Handles.DrawLine(from, to);
					}
				}
			}
			else if ((colliders[i] as EdgeCollider2D) != null){
				EdgeCollider2D collider = (EdgeCollider2D) colliders[i];
				Vector2[] vertices = collider.points;
				Vector3 position = transform.TransformPoint(new Vector3(collider.offset.x, collider.offset.y, 0));
				UnityEditor.Handles.matrix = Matrix4x4.TRS(position, transform.rotation, transform.localScale);
				for (int j = 0; j < vertices.Length; j++){
					if (j < vertices.Length - 1){
						Vector3 from = new Vector3(vertices[j].x, vertices[j].y, 0);
						Vector3 to = new Vector3(vertices[j + 1].x, vertices[j + 1].y, 0);
						UnityEditor.Handles.DrawLine(from, to);
					}
					else if (j == vertices.Length - 1){
						Vector3 from = new Vector3(vertices[j].x, vertices[j].y, 0);
						Vector3 to = new Vector3(vertices[0].x, vertices[0].y, 0);
						UnityEditor.Handles.DrawLine(from, to);
					}
				}
			}
		}
		// reset handles matrix
		UnityEditor.Handles.matrix = Matrix4x4.identity;
	}
}
