export const heroVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uPulse;
  uniform float uSecret;
  uniform vec3 uPointer;
  uniform float uPointerActive;

  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying float vDisplacement;
  varying float vPointerInfluence;

  // Simplex 3D Noise (Ashima Arts)
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float computeField(vec3 pos, float t, float morphState, float secretLevel, float pulseLevel, out float ptrInf) {
    vec3 nPos = normalize(pos);

    // State 0: Smooth Liquid Ferrofluid Harmonic
    float n0 = snoise(nPos * 1.65 + vec3(t * 0.28, -t * 0.22, t * 0.16));
    float d0 = n0 * 0.24 + 0.09 * sin(nPos.x * 4.5 + t) * cos(nPos.y * 4.5 - t);

    // State 1: Crystalline Gyroid Folding
    vec3 gPos = nPos * 3.6 + vec3(t * 0.35);
    float gyroid = sin(gPos.x) * cos(gPos.y) + sin(gPos.y) * cos(gPos.z) + sin(gPos.z) * cos(gPos.x);
    float d1 = gyroid * 0.21 + snoise(nPos * 2.8 - t * 0.22) * 0.1;

    // State 2: Sculpted Ridge Spire
    float ridge = 1.0 - abs(snoise(nPos * 2.3 + vec3(0.0, t * 0.3, 0.0)));
    ridge = pow(ridge, 2.1);
    float stepped = smoothstep(0.1, 0.9, ridge);
    float d2 = mix(ridge, stepped, 0.55) * 0.38 - 0.1;

    // State 3: Singularity Torsion Wave
    float angle = atan(nPos.z, nPos.x);
    float elev = asin(clamp(nPos.y, -1.0, 1.0));
    float spiral = sin(angle * 5.0 + elev * 7.0 - t * 2.0) * cos(elev * 5.0 + t * 1.2);
    float d3 = spiral * 0.26 + snoise(nPos * 3.8 + t * 0.45) * 0.12;

    // Smooth blend across 4 morph states (0..3)
    float m = mod(morphState, 4.0);
    float disp = d0;
    if (m < 1.0) {
      disp = mix(d0, d1, smoothstep(0.0, 1.0, m));
    } else if (m < 2.0) {
      disp = mix(d1, d2, smoothstep(1.0, 2.0, m));
    } else if (m < 3.0) {
      disp = mix(d2, d3, smoothstep(2.0, 3.0, m));
    } else {
      disp = mix(d3, d0, smoothstep(3.0, 4.0, m));
    }

    // Pointer 3D proximity deformation
    float distToPtr = distance(nPos, normalize(uPointer + vec3(0.0001)));
    ptrInf = exp(-distToPtr * distToPtr * 3.4) * uPointerActive;
    float ripple = sin(distToPtr * 13.0 - t * 5.5) * 0.065 * ptrInf;
    disp += ptrInf * 0.24 + ripple;

    // Click transformation shockwave pulse
    disp += sin(nPos.y * 9.0 - pulseLevel * 12.0) * pulseLevel * 0.16;

    // Secret Unleashed resonance overdrive
    if (secretLevel > 0.001) {
      float spikes = pow(abs(snoise(nPos * 5.0 + t * 1.6)), 1.6) * 0.48;
      disp += spikes * secretLevel;
    }

    return disp;
  }

  void main() {
    float ptrInf = 0.0;
    float d = computeField(position, uTime, uMorph, uSecret, uPulse, ptrInf);

    // Finite-difference normal recalculation for liquid-mirror chrome reflections
    float eps = 0.012;
    vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.001)));
    vec3 bitangent = normalize(cross(normal, tangent));
    float dummy1 = 0.0;
    float dummy2 = 0.0;
    vec3 pT = position + tangent * eps;
    vec3 pB = position + bitangent * eps;
    float dT = computeField(pT, uTime, uMorph, uSecret, uPulse, dummy1);
    float dB = computeField(pB, uTime, uMorph, uSecret, uPulse, dummy2);

    vec3 displacedPos = position + normal * d;
    vec3 displacedT = pT + normalize(pT) * dT;
    vec3 displacedB = pB + normalize(pB) * dB;
    vec3 recomputedNormal = normalize(cross(displacedT - displacedPos, displacedB - displacedPos));
    vec3 smoothNormal = normalize(mix(normal, recomputedNormal, 0.9));

    vDisplacement = d;
    vPointerInfluence = ptrInf;
    vNormal = normalize(normalMatrix * smoothNormal);
    vWorldNormal = normalize((modelMatrix * vec4(smoothNormal, 0.0)).xyz);

    vec4 worldPosition = modelMatrix * vec4(displacedPos, 1.0);
    vWorldPosition = worldPosition.xyz;

    vec4 mvPosition = viewMatrix * worldPosition;
    vViewPosition = -mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const heroFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uPulse;
  uniform float uSecret;

  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying float vDisplacement;
  varying float vPointerInfluence;

  // Spectral thin-film chromatic dispersion
  vec3 thinFilmIridescence(float cosTheta, float thickness) {
    vec3 phase = vec3(thickness * cosTheta * 6.28318) + vec3(0.0, 2.094, 4.188);
    vec3 wave = 0.5 + 0.5 * cos(phase);
    vec3 colA = vec3(0.773, 1.0, 0.333);   // Acid (#C5FF55)
    vec3 colB = vec3(0.624, 0.831, 1.0);   // Ice (#9FD4FF)
    vec3 colC = vec3(0.718, 0.612, 1.0);   // Violet (#B79CFF)
    return mix(mix(colA, colB, wave.x), colC, wave.y * 0.5);
  }

  // Procedural high-contrast studio softbox environment reflection
  vec3 sampleStudioEnv(vec3 R) {
    // Horizon band + overhead softbox strips for liquid mercury look
    float horizon = exp(-abs(R.y + 0.08) * 7.5);
    float topSoftbox = smoothstep(0.45, 0.92, R.y) * smoothstep(-0.6, 0.8, R.x);
    float sideStrip = smoothstep(0.62, 0.96, abs(R.x)) * (1.0 - abs(R.y));
    float diagBand = smoothstep(0.72, 0.95, sin(R.x * 4.5 + R.y * 3.5));

    vec3 env = vec3(0.02, 0.026, 0.022);
    env += vec3(0.95, 0.96, 0.93) * (topSoftbox * 0.95 + horizon * 0.55 + diagBand * 0.22);
    env += vec3(0.773, 1.0, 0.333) * (sideStrip * 0.48);
    env += vec3(0.624, 0.831, 1.0) * smoothstep(0.4, 0.95, -R.y) * 0.32;
    return env;
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);
    vec3 R = reflect(-V, N);
    float NdotV = max(dot(N, V), 0.0);

    // Schlick Fresnel for liquid metal / dark obsidian glass
    float fresnel = pow(1.0 - NdotV, 3.6);
    float rimFine = pow(1.0 - NdotV, 7.0);

    // Studio directional lights
    vec3 L1 = normalize(vec3(3.5, 4.8, 4.0));
    vec3 L2 = normalize(vec3(-4.2, -2.5, 2.5));
    vec3 L3 = normalize(vec3(0.0, 3.0, -4.0));

    vec3 H1 = normalize(L1 + V);
    vec3 H2 = normalize(L2 + V);
    vec3 H3 = normalize(L3 + V);

    // Ultra-sharp dual-lobe specular highlights
    float spec1 = pow(max(dot(N, H1), 0.0), 140.0) * 1.65 + pow(max(dot(N, H1), 0.0), 24.0) * 0.25;
    float spec2 = pow(max(dot(N, H2), 0.0), 64.0) * 0.7;
    float spec3 = pow(max(dot(N, H3), 0.0), 80.0) * 0.85;

    // Deep obsidian core & liquid chrome reflection
    vec3 obsidianCore = vec3(0.018, 0.022, 0.019);
    vec3 boneLight = vec3(0.96, 0.96, 0.93);
    vec3 acidColor = vec3(0.773, 1.0, 0.333);

    float valleyOcclusion = smoothstep(-0.26, 0.28, vDisplacement);
    vec3 envRefl = sampleStudioEnv(R);

    // Iridescent thin-film dispersion
    float filmThickness = 1.8 + vDisplacement * 4.2 + uMorph * 0.55 + sin(uTime * 0.35) * 0.2;
    vec3 iridescence = thinFilmIridescence(NdotV, filmThickness);

    // Compose liquid chrome surface
    vec3 color = mix(obsidianCore, envRefl * (0.45 + 0.55 * valleyOcclusion), 0.78);
    color = mix(color, iridescence * 0.85 + boneLight * 0.35, fresnel * 0.75);

    // Add razor-sharp specular reflections
    color += boneLight * spec1;
    color += acidColor * spec2;
    color += iridescence * spec3;
    color += acidColor * rimFine * 0.65;

    // Subtle energy glow on high-curvature crests, pointer interaction, and morph pulse
    float crest = smoothstep(0.16, 0.36, vDisplacement) * fresnel;
    float pointerGlow = vPointerInfluence * (0.35 + 0.65 * fresnel);
    float pulseGlow = uPulse * fresnel * 1.1;
    float secretGlow = uSecret * (0.3 + 0.7 * smoothstep(0.04, 0.38, vDisplacement));

    color += acidColor * (crest * 0.75 + pointerGlow * 0.85 + pulseGlow + secretGlow);

    // Aces-inspired filmic tone mapping for rich blacks & luminous highlights
    color = (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14);
    color = pow(clamp(color, 0.0, 1.0), vec3(0.94));

    gl_FragColor = vec4(color, 1.0);
  }
`;
