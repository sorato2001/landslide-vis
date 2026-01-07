/**
 * Cesium - https://github.com/CesiumGS/cesium
 *
 * Copyright 2011-2020 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/CesiumGS/cesium/blob/master/LICENSE.md for full licensing details.
 */
define(["./when-60b00257","./Check-4274a1fd","./Math-9d37f659","./Cartesian2-2951f601","./Transforms-53ff6d12","./RuntimeError-027c380a","./WebGLConstants-779bf0bc","./ComponentDatatype-a29c6075","./GeometryAttribute-2f728681","./GeometryAttributes-130e4d69","./VertexFormat-6af5bab1"],function(a,e,t,p,y,r,n,c,s,A,o){"use strict";function m(e){e=a.defaultValue(e,a.defaultValue.EMPTY_OBJECT);var t=a.defaultValue(e.vertexFormat,o.VertexFormat.DEFAULT);this._vertexFormat=t,this._workerName="createPlaneGeometry"}m.packedLength=o.VertexFormat.packedLength,m.pack=function(e,t,r){return r=a.defaultValue(r,0),o.VertexFormat.pack(e._vertexFormat,t,r),t};var i=new o.VertexFormat,u={vertexFormat:i};m.unpack=function(e,t,r){t=a.defaultValue(t,0);var n=o.VertexFormat.unpack(e,t,i);return a.defined(r)?(r._vertexFormat=o.VertexFormat.clone(n,r._vertexFormat),r):new m(u)};var l=new p.Cartesian3(-.5,-.5,0),F=new p.Cartesian3(.5,.5,0);return m.createGeometry=function(e){var t,r,n,a,o,m,i=e._vertexFormat,u=new A.GeometryAttributes;return i.position&&((m=new Float64Array(12))[0]=l.x,m[1]=l.y,m[2]=0,m[3]=F.x,m[4]=l.y,m[5]=0,m[6]=F.x,m[7]=F.y,m[8]=0,m[9]=l.x,m[10]=F.y,m[11]=0,u.position=new s.GeometryAttribute({componentDatatype:c.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:m}),i.normal&&((r=new Float32Array(12))[0]=0,r[1]=0,r[2]=1,r[3]=0,r[4]=0,r[5]=1,r[6]=0,r[7]=0,r[8]=1,r[9]=0,r[10]=0,r[11]=1,u.normal=new s.GeometryAttribute({componentDatatype:c.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:r})),i.st&&((n=new Float32Array(8))[0]=0,n[1]=0,n[2]=1,n[3]=0,n[4]=1,n[5]=1,n[6]=0,n[7]=1,u.st=new s.GeometryAttribute({componentDatatype:c.ComponentDatatype.FLOAT,componentsPerAttribute:2,values:n})),i.tangent&&((a=new Float32Array(12))[0]=1,a[1]=0,a[2]=0,a[3]=1,a[4]=0,a[5]=0,a[6]=1,a[7]=0,a[8]=0,a[9]=1,a[10]=0,a[11]=0,u.tangent=new s.GeometryAttribute({componentDatatype:c.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:a})),i.bitangent&&((o=new Float32Array(12))[0]=0,o[1]=1,o[2]=0,o[3]=0,o[4]=1,o[5]=0,o[6]=0,o[7]=1,o[8]=0,o[9]=0,o[10]=1,o[11]=0,u.bitangent=new s.GeometryAttribute({componentDatatype:c.ComponentDatatype.FLOAT,componentsPerAttribute:3,values:o})),(t=new Uint16Array(6))[0]=0,t[1]=1,t[2]=2,t[3]=0,t[4]=2,t[5]=3),new s.Geometry({attributes:u,indices:t,primitiveType:s.PrimitiveType.TRIANGLES,boundingSphere:new y.BoundingSphere(p.Cartesian3.ZERO,Math.sqrt(2))})},function(e,t){return a.defined(t)&&(e=m.unpack(e,t)),m.createGeometry(e)}});
