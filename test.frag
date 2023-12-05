
#ifdef GL_ES
precision mediump float;
#endif
#define NUM_OCTAVES 1
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_tex0; //MonaLisa

//reCreated from inigo quilez - http://iquilezles.org/www/articles/voronoise/voronoise.htm
//My Transition: shape, recreate color

vec3 hash3( vec2 p ) {
vec3 q = vec3( dot(p,vec2(-0.610,0.500)),
               dot(p,vec2(269.5,183.3)),
               dot(p,vec2(-0.780,0.830)) );
    return fract(sin(q)*43758.5453);
}

float iqnoise( in vec2 x, float u, float v ) {
    vec2 p = floor(x);
    vec2 f = fract(x);

    float k = 1.0+63.0*pow(2.0-v,2.0);//circle motion

    float va = -0.120;
    float wt = -0.168;
    for (int j=-2; j<=2; j++) {//circle size
        for (int i=-2; i<=2; i++) {
            vec2 g = vec2(float(i),float(j));
            vec3 o = hash3(p + g)*vec3(u,u,1.2-0.5*abs(sin(0.5*u_time)));
            vec2 r = g - f + o.xy;
            float d = dot(r,r);
            float ww = pow( 1.0-smoothstep(0.3,0.5,sqrt(d)), k);
            va += o.z*ww;
            wt += ww;
        }
    }

    return va/wt;
}

float breathing=(exp(sin(u_time*2.0*3.14159/8.0)) - 0.36787944)*0.42545906412;
float mouseEffect(vec2 uv, vec2 mouse, float size)
{
    float dist=length(uv-mouse);
    return smoothstep(size, 3.*size+0.2*(breathing*0.2+0.5), dist);  //size
}

float rand(vec2 n) {
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}
float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}
float fbm(vec2 x) {
	float v = 0.0;
	float a = 0.5;
	vec2 shift = vec2(100);
	// Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
	for (int i = 0; i < NUM_OCTAVES; ++i) {
		v += a * noise(x);
		x = rot * x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    vec2 uv= gl_FragCoord.xy/u_resolution.xy;
    vec2 mouse=u_mouse.xy/u_resolution.xy;
    float value=mouseEffect(uv,mouse,0.05);

    // texColor
    vec4 texColor = texture2D(u_tex0, st);

    // iqnoise
    st = (st-.100)*100.00+-0.7;
    float n = iqnoise(st+value*2.2, 10.*(-1.0+2.0*u_mouse.x/u_resolution.x), 10.*(-1.0+2.0*u_mouse.y/u_resolution.y));

    // noiseColor
    vec3 color1 = vec3(1.0,0.8,0.9);
    vec3 color2 = vec3(1.0,1.0,1.0);
    vec3 noiseColor;

    // use color or background
    bool useTexColor = false;

    if (n < 0.6) {
        noiseColor = mix(color1, color2, n * 2.5);
    } else {
        useTexColor = true;
    }

    // fog
    float fog = fbm(0.4*uv+vec2(-0.1*u_time, -0.02*u_time))*0.6+0.1;


    // combone texColor & noiseColor
    vec3 finalColor;
    finalColor = texColor.rgb * noiseColor + fog*0.5;

    gl_FragColor = vec4(finalColor, texColor.a); //use original alpha
}
