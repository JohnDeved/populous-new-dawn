// Clip the existing terrain fragments instead of allocating the original temporary
// terrain/edge polygon pools. Atlas tile 15 supplies the native translucent fill.
export const dragOverlayShader = `
uniform bool dragActive;
uniform vec2 dragQuad[4];
uniform sampler2D dragAtlas;
varying vec2 dragPoint;
float dragCross(vec2 a,vec2 b,vec2 p){return (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);}
bool dragTriangle(vec2 a,vec2 b,vec2 c,vec2 p){
 return dragCross(a,b,p)<=0.&&dragCross(b,c,p)<=0.&&dragCross(c,a,p)<=0.;
}
vec4 dragOverlay(vec4 ground){
 if(!dragActive)return ground;
 vec2 p=mod(dragPoint,65536.);
 vec2 high=max(max(dragQuad[0],dragQuad[1]),max(dragQuad[2],dragQuad[3]));
 vec2 low=min(min(dragQuad[0],dragQuad[1]),min(dragQuad[2],dragQuad[3]));
 if(high.x>=65536.&&p.x<32768.)p.x+=65536.;
 if(high.y>=65536.&&p.y<32768.)p.y+=65536.;
 if(any(lessThan(p,low))||any(greaterThan(p,high)))return ground;
 if(!dragTriangle(dragQuad[0],dragQuad[1],dragQuad[2],p)&&
    !dragTriangle(dragQuad[0],dragQuad[2],dragQuad[3],p))return ground;
 vec4 fill=texture2D(dragAtlas,(vec2(224.5,1024.-32.5)+vec2(fract(p.x/512.),-fract(p.y/512.))*31.)/vec2(256.,1024.));
 return vec4(mix(ground.rgb,fill.rgb,fill.a),ground.a);
}
`
