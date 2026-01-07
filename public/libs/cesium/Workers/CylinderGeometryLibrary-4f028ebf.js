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
define(["exports","./Math-9d37f659"],function(r,b){"use strict";var t={computePositions:function(r,t,e,a,i){for(var n=.5*r,o=-n,s=a+a,u=new Float64Array(3*(i?2*s:s)),c=0,f=0,h=i?3*s:0,y=i?3*(s+a):3*a,M=0;M<a;M++){var d=M/a*b.CesiumMath.TWO_PI,m=Math.cos(d),v=Math.sin(d),l=m*e,p=v*e,C=m*t,P=v*t;u[f+h]=l,u[f+h+1]=p,u[f+h+2]=o,u[f+y]=C,u[f+y+1]=P,u[f+y+2]=n,f+=3,i&&(u[c++]=l,u[c++]=p,u[c++]=o,u[c++]=C,u[c++]=P,u[c++]=n)}return u}};r.CylinderGeometryLibrary=t});
