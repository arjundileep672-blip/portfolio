export const heroVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uPulse;
  uniform float uSecret;
  uniform vec3 uPointer;
  uniform float uPointerActive;

  varying vec3 vNormal;
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

    // State 0: Organic Harmonic Geodesic
    float n0 = snoise(nPos * 1.85 + vec3(t * 0.32, -t * 0.24, t * 0.18));
    float d0 = n0 * 0.26 + 0.08 * sin(nPos.x * 5.0 + t) * cos(nPos.y * 5.0 - t);

    // State 1: Crystalline Gyroid Folding
    vec3 gPos = nPos * 3.8 + vec3(t * 0.4);
    float gyroid = sin(gPos.x) * cos(gPos.y) + sin(gPos.y) * cos(gPos.z) + sin(gPos.z) * cos(gPos.x);
    float d1 = gyroid * 0.22 + snoise(nPos * 3.2 - t * 0.25) * 0.12;

    // State 2: Quantized Tectonic Ridge Spire
    float ridge = 1.0 - abs(snoise(nPos * 2.5 + vec3(0.0, t * 0.35, 0.0)));
    ridge = pow(ridge, 2.2);
    float stepped = floor(ridge * 6.0) / 6.0;
    float d2 = mix(ridge, stepped, 0.65) * 0.42 - 0.12;

    // State 3: High-Frequency Singularity Harmonics
    float angle = atan(nPos.z, nPos.x);
    float elev = asin(clamp(nPos.y, -1.0, 1.0));
    float spiral = sin(angle * 6.0 + elev * 8.0 - t * 2.2) * cos(elev * 6.0 + t * 1.4);
    float d3 = spiral * 0.28 + snoise(nPos * 4.2 + t * 0.5) * 0.14;

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
    ptrInf = exp(-distToPtr * distToPtr * 3.2) * uPointerActive;
    float ripple = sin(distToPtr * 14.0 - t * 6.0) * 0.08 * ptrInf;
    disp += ptrInf * 0.28 + ripple;

    // Click transformation shockwave pulse
    disp += sin(nPos.y * 10.0 - pulseLevel * 12.0) * pulseLevel * 0.18;

    // Secret Unleashed resonance overdrive
    if (secretLevel > 0.001) {
      float spikes = pow(abs(snoise(nPos * 5.5 + t * 1.8)), 1.6) * 0.55;
      disp += spikes * secretLevel;
    }

    return disp;
  }

  void main() {
    float ptrInf = 0.0;
    float d = computeField(position, uTime, uMorph, uSecret, uPulse, ptrInf);

    // Finite-difference normal recalculation for crisp metallic reflections
    float eps = 0.015;
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

    vDisplacement = d;
    vPointerInfluence = ptrInf;
    vNormal = normalize(normalMatrix * mix(normal, recomputedNormal, 0.85));

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
  varying vec3 vWorldPosition;
  varying vec3 vViewPosition;
  varying float vDisplacement;
  varying float vPointerInfluence;

  // Spectral thin-film interference approximation
  vec3 thinFilmIridescence(float cosTheta, float thickness) {
    vec3 phase = vec3(thickness * cosTheta * 6.28318) + vec3(0.0, 2.094, 4.188);
    vec3 wave = 0.5 + 0.5 * cos(phase);
    // Remap into UNBOUND editorial palette: Acid (#C5FF55), Bone (#F2F2EA), Ice (#9FD4FF), Violet (#B79CFF)
    vec3 colA = vec3(0.773, 1.0, 0.333);   // #C5FF55
    vec3 colB = vec3(0.624, 0.831, 1.0);   // #9FD4FF
    vec3 colC = vec3(0.718, 0.612, 1.0);   // #B79CFF
    return mix(mix(colA, colB, wave.x), colC, wave.y * 0.55);
  }

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);
    float NdotV = max(dot(N, V), 0.0);
    float fresnel = pow(1.0 - NdotV, 3.2);

    // Studio directional lights
    vec3 L1 = normalize(vec3(3.5, 4.5, 4.0));
    vec3 L2 = normalize(vec3(-4.0, -2.5, 2.0));
    vec3 L3 = normalize(vec3(0.5, -4.0, -3.5));

    vec3 H1 = normalize(L1 + V);
    vec3 H2 = normalize(L2 + V);
    vec3 H3 = normalize(L3 + V);

    float diff1 = max(dot(N, L1), 0.0);
    float diff2 = max(dot(N, L2), 0.0);

    float spec1 = pow(max(dot(N, H1), 0.0), 64.0);
    float spec2 = pow(max(dot(N, H2), 0.0), 28.0);
    float spec3 = pow(max(dot(N, H3), 0.0), 42.0);

    // Base dark gunmetal / obsidian alloy (#080A08 -> #181C17)
    vec3 baseDark = vec3(0.035, 0.043, 0.035);
    vec3 baseMetal = vec3(0.14, 0.16, 0.14);
    vec3 boneLight = vec3(0.949, 0.949, 0.918); // #F2F2EA
    vec3 acidColor = vec3(0.773, 1.0, 0.333);   // #C5FF55

    // Height-based occlusion & ridge mask
    float heightMask = smoothstep(-0.22, 0.34, vDisplacement);
    vec3 surfaceColor = mix(baseDark, baseMetal, heightMask);

    // Iridescent thin-film layer driven by displacement & viewing angle
    float filmThickness = 1.6 + vDisplacement * 3.8 + uMorph * 0.45 + sin(uTime * 0.4) * 0.2;
    vec3 iridescence = thinFilmIridescence(NdotV, filmThickness);

    // Combine diffuse + specular + iridescence
    vec3 color = surfaceColor;
    color += boneLight * diff1 * 0.28;
    color += iridescence * diff2 * 0.22;
    color += mix(boneLight, iridescence, 0.55) * fresnel * 0.72;

    // Sharp metallic highlights
    color += boneLight * spec1 * 1.15;
    color += acidColor * spec2 * 0.48;
    color += iridescence * spec3 * 0.55;

    // Precision acid-lime energy seams in high-curvature ridges & pointer locus
    float ridgeEnergy = smoothstep(0.18, 0.38, vDisplacement) * fresnel;
    float pointerGlow = vPointerInfluence * (0.45 + 0.55 * fresnel);
    float pulseGlow = uPulse * fresnel * 0.9;
    float secretGlow = uSecret * (0.35 + 0.65 * smoothstep(0.05, 0.4, vDisplacement));

    color += acidColor * (ridgeEnergy * 0.85 + pointerGlow * 0.95 + pulseGlow + secretGlow);

    // Subtle contour scanlines on deep troughs for technical editorial aesthetic
    float contour = abs(fract(vDisplacement * 14.0) - 0.5);
    float contourLine = 1.0 - smoothstep(0.0, 0.07, contour);
    color += acidColor * contourLine * 0.14 * (0.4 + vPointerInfluence + uSecret);

    // Tone mapping & gamma curve
    color = color / (color + vec3(0.65));
    color = pow(color, vec3(0.92));

    gl_FragColor = vec4(color, 1.0);
  }
`;
