// GLSL 3D Simplex Noise and Hero Sculpture Shader
export const sculptureVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMorph;
  uniform float uExplode;
  uniform float uPulse;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDisplacement;
  varying float vFresnel;

  // Simplex 3D noise
  vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z.xxxx);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Multi-frequency noise displacement calculation
  float getDisplacement(vec3 p) {
    // Mode 0: Liquid metallic flow
    float n1 = snoise(p * 1.2 + vec3(uTime * 0.35));
    float n2 = snoise(p * 2.5 - vec3(uTime * 0.2)) * 0.4;
    float liquid = (n1 + n2) * 0.32;

    // Mode 1: Crystalline ridges
    float ridges = abs(snoise(p * 2.0 + vec3(uTime * 0.4))) * 0.5;
    ridges += sin(p.y * 8.0 + uTime) * 0.08;

    // Mode 2: Kinetic pulse tendrils
    float tendrils = snoise(p * 3.2 + vec3(0.0, uTime * 0.8, 0.0)) * 0.45;
    tendrils += cos(atan(p.z, p.x) * 4.0 + uTime * 1.5) * 0.12;

    // Blend modes smoothly based on uMorph (0..2 range)
    float baseDisp;
    if (uMorph < 1.0) {
      baseDisp = mix(liquid, ridges, uMorph);
    } else {
      baseDisp = mix(ridges, tendrils, uMorph - 1.0);
    }

    // Mouse influence (bulge / localized ripple)
    float mouseDist = length(p.xy - uMouse * 1.8);
    float mouseRipple = exp(-mouseDist * 2.5) * 0.25 * sin(mouseDist * 12.0 - uTime * 4.0);

    // Click pulse
    float pulse = sin(length(p) * 6.0 - uPulse * 8.0) * exp(-uPulse * 2.0) * 0.2;

    return baseDisp + mouseRipple + pulse;
  }

  void main() {
    vUv = uv;
    vec3 p = position;

    // Secret explode effect: expand outward with curl noise
    if (uExplode > 0.0) {
      vec3 explodeDir = normalize(position) + vec3(
        snoise(position + vec3(uTime)),
        snoise(position + vec3(uTime + 10.0)),
        snoise(position + vec3(uTime + 20.0))
      ) * 0.5;
      p += explodeDir * (uExplode * 1.8);
    }

    float disp = getDisplacement(p);
    vDisplacement = disp;

    // Finite differences to compute exact deformed normal
    float eps = 0.01;
    vec3 tangent1 = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
    if (length(tangent1) < 0.001) {
      tangent1 = normalize(cross(normal, vec3(1.0, 0.0, 0.0)));
    }
    vec3 tangent2 = normalize(cross(normal, tangent1));

    vec3 p1 = p + normal * disp;
    vec3 p2 = (p + tangent1 * eps) + normal * getDisplacement(p + tangent1 * eps);
    vec3 p3 = (p + tangent2 * eps) + normal * getDisplacement(p + tangent2 * eps);

    vec3 newNormal = normalize(cross(p2 - p1, p3 - p1));
    vNormal = normalize(normalMatrix * newNormal);

    vec4 worldPos = modelMatrix * vec4(p1, 1.0);
    vWorldPosition = worldPos.xyz;

    vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
    vFresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const sculptureFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uExplode;
  uniform float uGlow;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDisplacement;
  varying float vFresnel;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);

    // Directional acid light
    vec3 lightDir = normalize(vec3(1.2, 1.5, 1.0));
    float diff = max(dot(N, lightDir), 0.0);

    // Directional rim/fill
    vec3 fillDir = normalize(vec3(-1.0, -0.5, -0.5));
    float fillDiff = max(dot(N, fillDir), 0.0);

    // Specular highlight (Blinn-Phong)
    vec3 H = normalize(lightDir + V);
    float spec = pow(max(dot(N, H), 0.0), 32.0);

    // Iridescent colors:
    // Brand ink background (#080A08), acid-green accent (#C5FF55), iridescent sheen
    vec3 darkChrome = vec3(0.05, 0.065, 0.055);
    vec3 acidGreen = vec3(0.772, 1.0, 0.333); // #C5FF55
    vec3 softTeal = vec3(0.2, 0.8, 0.7);
    vec3 deepViolet = vec3(0.55, 0.25, 0.85);

    // Thin film color variation with displacement & normal angles
    float filmAngle = dot(N, V) * 3.0 + vDisplacement * 2.0;
    vec3 iridescence = mix(softTeal, acidGreen, sin(filmAngle + uTime * 0.5) * 0.5 + 0.5);
    iridescence = mix(iridescence, deepViolet, cos(filmAngle * 1.5) * 0.3 + 0.3);

    // Compose surface color
    vec3 color = darkChrome * 0.4;
    color += iridescence * vFresnel * 1.6;
    color += acidGreen * diff * 0.4;
    color += acidGreen * spec * 0.9;
    color += vec3(0.12, 0.16, 0.14) * fillDiff * 0.3;

    // Accent rim glow
    float rim = pow(1.0 - max(dot(N, V), 0.0), 4.0);
    color += acidGreen * rim * 1.2;

    // Secret trigger extra radiance & pulsation
    if (uExplode > 0.0 || uGlow > 0.0) {
      color += acidGreen * (uExplode * 1.5 + uGlow * 0.8);
      color += vec3(1.0) * pow(vFresnel, 2.0) * (uExplode + uGlow);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;
