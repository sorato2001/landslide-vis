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
define(["./when-60b00257","./Check-4274a1fd","./Math-9d37f659","./Cartesian2-2951f601","./Transforms-53ff6d12","./RuntimeError-027c380a","./WebGLConstants-779bf0bc","./ComponentDatatype-a29c6075","./GeometryAttribute-2f728681","./GeometryAttributes-130e4d69","./IndexDatatype-527cbd94","./IntersectionTests-57fe18b2","./Plane-df4a621e","./arrayRemoveDuplicates-ac049603","./BoundingRectangle-762cb49e","./EllipsoidTangentPlane-f9b097b8","./EllipsoidRhumbLine-cbcd6a13","./PolygonPipeline-72c6abb2","./PolylineVolumeGeometryLibrary-a55f99d5","./EllipsoidGeodesic-0d3740b4","./PolylinePipeline-30fab084"],function(d,e,a,c,y,i,n,h,f,g,m,t,r,o,l,s,p,u,v,E,b){"use strict";function P(e){var i=(e=d.defaultValue(e,d.defaultValue.EMPTY_OBJECT)).polylinePositions,n=e.shapePositions;this._positions=i,this._shape=n,this._ellipsoid=c.Ellipsoid.clone(d.defaultValue(e.ellipsoid,c.Ellipsoid.WGS84)),this._cornerType=d.defaultValue(e.cornerType,v.CornerType.ROUNDED),this._granularity=d.defaultValue(e.granularity,a.CesiumMath.RADIANS_PER_DEGREE),this._workerName="createPolylineVolumeOutlineGeometry";var t=1+i.length*c.Cartesian3.packedLength;t+=1+n.length*c.Cartesian2.packedLength,this.packedLength=t+c.Ellipsoid.packedLength+2}P.pack=function(e,i,n){var t;n=d.defaultValue(n,0);var a=e._positions,r=a.length;for(i[n++]=r,t=0;t<r;++t,n+=c.Cartesian3.packedLength)c.Cartesian3.pack(a[t],i,n);var o=e._shape,r=o.length;for(i[n++]=r,t=0;t<r;++t,n+=c.Cartesian2.packedLength)c.Cartesian2.pack(o[t],i,n);return c.Ellipsoid.pack(e._ellipsoid,i,n),n+=c.Ellipsoid.packedLength,i[n++]=e._cornerType,i[n]=e._granularity,i};var _=c.Ellipsoid.clone(c.Ellipsoid.UNIT_SPHERE),k={polylinePositions:void 0,shapePositions:void 0,ellipsoid:_,height:void 0,cornerType:void 0,granularity:void 0};P.unpack=function(e,i,n){i=d.defaultValue(i,0);for(var t=e[i++],a=new Array(t),r=0;r<t;++r,i+=c.Cartesian3.packedLength)a[r]=c.Cartesian3.unpack(e,i);t=e[i++];var o=new Array(t);for(r=0;r<t;++r,i+=c.Cartesian2.packedLength)o[r]=c.Cartesian2.unpack(e,i);var l=c.Ellipsoid.unpack(e,i,_);i+=c.Ellipsoid.packedLength;var s=e[i++],p=e[i];return d.defined(n)?(n._positions=a,n._shape=o,n._ellipsoid=c.Ellipsoid.clone(l,n._ellipsoid),n._cornerType=s,n._granularity=p,n):(k.polylinePositions=a,k.shapePositions=o,k.cornerType=s,k.granularity=p,new P(k))};var C=new l.BoundingRectangle;return P.createGeometry=function(e){var i=e._positions,n=o.arrayRemoveDuplicates(i,c.Cartesian3.equalsEpsilon),t=e._shape,t=v.PolylineVolumeGeometryLibrary.removeDuplicatesFromShape(t);if(!(n.length<2||t.length<3)){u.PolygonPipeline.computeWindingOrder2D(t)===u.WindingOrder.CLOCKWISE&&t.reverse();var a=l.BoundingRectangle.fromPoints(t,C);return function(e,i){var n=new g.GeometryAttributes;n.position=new f.GeometryAttribute({componentDatatype:h.ComponentDatatype.DOUBLE,componentsPerAttribute:3,values:e});var t=i.length,a=n.position.values.length/3,r=e.length/3/t,o=m.IndexDatatype.createTypedArray(a,2*t*(1+r)),l=0,s=0,p=s*t;for(u=0;u<t-1;u++)o[l++]=u+p,o[l++]=u+p+1;for(o[l++]=t-1+p,o[l++]=p,p=(s=r-1)*t,u=0;u<t-1;u++)o[l++]=u+p,o[l++]=u+p+1;for(o[l++]=t-1+p,o[l++]=p,s=0;s<r-1;s++)for(var d=t*s,c=d+t,u=0;u<t;u++)o[l++]=u+d,o[l++]=u+c;return new f.Geometry({attributes:n,indices:m.IndexDatatype.createTypedArray(a,o),boundingSphere:y.BoundingSphere.fromVertices(e),primitiveType:f.PrimitiveType.LINES})}(v.PolylineVolumeGeometryLibrary.computePositions(n,t,a,e,!1),t)}},function(e,i){return d.defined(i)&&(e=P.unpack(e,i)),e._ellipsoid=c.Ellipsoid.clone(e._ellipsoid),P.createGeometry(e)}});
