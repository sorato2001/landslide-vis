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
define(["exports","./when-60b00257","./Math-9d37f659","./Cartesian2-2951f601","./EllipsoidTangentPlane-f9b097b8","./PolygonPipeline-72c6abb2","./PolylinePipeline-30fab084"],function(e,C,A,m,w,b,E){"use strict";var i={};var O=new m.Cartographic,M=new m.Cartographic;function L(e,i,t,n){var r=i.length;if(!(r<2)){var o=C.defined(n),a=C.defined(t),l=!0,h=new Array(r),s=new Array(r),g=new Array(r),p=i[0];h[0]=p;var P=e.cartesianToCartographic(p,O);a&&(P.height=t[0]),l=l&&P.height<=0,s[0]=P.height,g[0]=o?n[0]:0;for(var d,u,c=1,v=1;v<r;++v){var f=i[v],y=e.cartesianToCartographic(f,M);a&&(y.height=t[v]),l=l&&y.height<=0,d=P,u=y,A.CesiumMath.equalsEpsilon(d.latitude,u.latitude,A.CesiumMath.EPSILON14)&&A.CesiumMath.equalsEpsilon(d.longitude,u.longitude,A.CesiumMath.EPSILON14)?P.height<y.height&&(s[c-1]=y.height):(h[c]=f,s[c]=y.height,g[c]=o?n[v]:0,m.Cartographic.clone(y,P),++c)}if(!(l||c<2))return h.length=c,s.length=c,g.length=c,{positions:h,topHeights:s,bottomHeights:g}}}var F=new Array(2),H=new Array(2),T={positions:void 0,height:void 0,granularity:void 0,ellipsoid:void 0};i.computePositions=function(e,i,t,n,r,o){var a,l=L(e,i,t,n);if(C.defined(l)){i=l.positions,t=l.topHeights,n=l.bottomHeights,3<=i.length&&(a=w.EllipsoidTangentPlane.fromPoints(i,e).projectPointsOntoPlane(i),b.PolygonPipeline.computeWindingOrder2D(a)===b.WindingOrder.CLOCKWISE&&(i.reverse(),t.reverse(),n.reverse()));var h,s,g=i.length,p=g-2,P=A.CesiumMath.chordLength(r,e.maximumRadius),d=T;if(d.minDistance=P,d.ellipsoid=e,o){for(var u=0,c=0;c<g-1;c++)u+=E.PolylinePipeline.numberOfPoints(i[c],i[c+1],P)+1;h=new Float64Array(3*u),s=new Float64Array(3*u);var v=F,f=H;d.positions=v,d.height=f;var y=0;for(c=0;c<g-1;c++){v[0]=i[c],v[1]=i[c+1],f[0]=t[c],f[1]=t[c+1];var m=E.PolylinePipeline.generateArc(d);h.set(m,y),f[0]=n[c],f[1]=n[c+1],s.set(E.PolylinePipeline.generateArc(d),y),y+=m.length}}else d.positions=i,d.height=t,h=new Float64Array(E.PolylinePipeline.generateArc(d)),d.height=n,s=new Float64Array(E.PolylinePipeline.generateArc(d));return{bottomPositions:s,topPositions:h,numCorners:p}}},e.WallGeometryLibrary=i});
