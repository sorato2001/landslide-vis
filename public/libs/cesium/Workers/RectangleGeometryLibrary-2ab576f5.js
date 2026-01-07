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
define(["exports","./when-60b00257","./Check-4274a1fd","./Math-9d37f659","./Cartesian2-2951f601","./Transforms-53ff6d12","./GeometryAttribute-2f728681"],function(t,f,n,O,b,a,x){"use strict";var p=Math.cos,G=Math.sin,R=Math.sqrt,r={computePosition:function(t,n,a,r,e,o,s){var i,g=n.radiiSquared,h=t.nwCorner,u=t.boundingRectangle,C=h.latitude-t.granYCos*r+e*t.granXSin,c=p(C),l=G(C),S=g.z*l,d=h.longitude+r*t.granYSin+e*t.granXCos,w=c*p(d),M=c*G(d),X=g.x*w,Y=g.y*M,m=R(X*w+Y*M+S*l);o.x=X/m,o.y=Y/m,o.z=S/m,a&&(i=t.stNwCorner,f.defined(i)?(C=i.latitude-t.stGranYCos*r+e*t.stGranXSin,d=i.longitude+r*t.stGranYSin+e*t.stGranXCos,s.x=(d-t.stWest)*t.lonScalar,s.y=(C-t.stSouth)*t.latScalar):(s.x=(d-u.west)*t.lonScalar,s.y=(C-u.south)*t.latScalar))}},y=new x.Matrix2,v=new b.Cartesian3,P=new b.Cartographic,W=new b.Cartesian3,_=new a.GeographicProjection;function T(t,n,a,r,e,o,s){var i=Math.cos(n),g=r*i,h=a*i,u=Math.sin(n),C=r*u,c=a*u;v=_.project(t,v),v=b.Cartesian3.subtract(v,W,v);var l=x.Matrix2.fromRotation(n,y);v=x.Matrix2.multiplyByVector(l,v,v),v=b.Cartesian3.add(v,W,v),--o,--s;var S=(t=_.unproject(v,t)).latitude,d=S+o*c,w=S-g*s,M=S-g*s+o*c,X=Math.max(S,d,w,M),Y=Math.min(S,d,w,M),m=t.longitude,f=m+o*h,p=m+s*C,G=m+s*C+o*h;return{north:X,south:Y,east:Math.max(m,f,p,G),west:Math.min(m,f,p,G),granYCos:g,granYSin:C,granXCos:h,granXSin:c,nwCorner:t}}r.computeOptions=function(t,n,a,r,e,o,s){var i=t.east,g=t.west,h=t.north,u=t.south,C=!1,c=!1;h===O.CesiumMath.PI_OVER_TWO&&(C=!0),u===-O.CesiumMath.PI_OVER_TWO&&(c=!0);var l,S,d,w=h-u,M=(l=i<g?O.CesiumMath.TWO_PI-g+i:i-g)/((S=Math.ceil(l/n)+1)-1),X=w/((d=Math.ceil(w/n)+1)-1),Y=b.Rectangle.northwest(t,o),m=b.Rectangle.center(t,P);0===a&&0===r||(m.longitude<Y.longitude&&(m.longitude+=O.CesiumMath.TWO_PI),W=_.project(m,W));var f,p,G,x=X,R=M,y=b.Rectangle.clone(t,e),v={granYCos:x,granYSin:0,granXCos:R,granXSin:0,nwCorner:Y,boundingRectangle:y,width:S,height:d,northCap:C,southCap:c};return 0!==a&&(h=(f=T(Y,a,M,X,0,S,d)).north,u=f.south,i=f.east,g=f.west,v.granYCos=f.granYCos,v.granYSin=f.granYSin,v.granXCos=f.granXCos,v.granXSin=f.granXSin,y.north=h,y.south=u,y.east=i,y.west=g),0!==r&&(a-=r,G=T(p=b.Rectangle.northwest(y,s),a,M,X,0,S,d),v.stGranYCos=G.granYCos,v.stGranXCos=G.granXCos,v.stGranYSin=G.granYSin,v.stGranXSin=G.granXSin,v.stNwCorner=p,v.stWest=G.west,v.stSouth=G.south),v},t.RectangleGeometryLibrary=r});
