// 포스트 프로세싱: 줌/방향 블러 → 색수차 → 글리치 → 플래시 → 비네팅 → 필름 그레인
(() => {
  'use strict';

  const VS = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

  const FS = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform float u_ca, u_flash, u_zoom, u_glitch, u_grain, u_vig, u_seed;
uniform vec2 u_dir;
in vec2 v_uv;
out vec4 o;

float h21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec3 tap(vec2 uv, vec2 caOff) {
  return vec3(
    texture(u_tex, uv + caOff).r,
    texture(u_tex, uv).g,
    texture(u_tex, uv - caOff).b
  );
}

void main() {
  vec2 uv = v_uv;
  vec2 c = vec2(0.5);

  // 글리치: 가로 블록 단위 변위
  if (u_glitch > 0.001) {
    float row = floor(uv.y * 28.0);
    float r = h21(vec2(row, floor(u_seed * 17.0)));
    if (r < u_glitch * 0.55) {
      uv.x += (h21(vec2(row, 3.1 + u_seed)) - 0.5) * 0.18 * u_glitch;
    }
  }

  vec2 d = uv - c;
  vec2 caOff = d * (u_ca / u_res.x) * 1.6;

  vec3 col;
  bool blur = length(u_dir) > 0.5 || u_zoom > 0.001;
  if (blur) {
    const int N = 20;
    vec3 acc = vec3(0.0);
    for (int i = 0; i < N; i++) {
      float f = float(i) / float(N - 1) - 0.5;
      vec2 u = uv + (u_dir / u_res) * f;
      u = c + (u - c) * (1.0 - u_zoom * (f + 0.5));
      acc += tap(u, caOff);
    }
    col = acc / float(N);
  } else {
    col = tap(uv, caOff);
  }

  col = mix(col, vec3(1.0), u_flash);
  float v = length(d * vec2(1.0, 0.82)) * 1.35;
  col *= 1.0 - u_vig * pow(v, 2.6);
  col += (h21(v_uv * u_res + u_seed * 311.0) - 0.5) * u_grain;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

  class Post {
    constructor(canvas, w, h) {
      this.w = w;
      this.h = h;
      const gl = canvas.getContext('webgl2', {
        preserveDrawingBuffer: true,
        antialias: false,
        premultipliedAlpha: false,
      });
      if (!gl) throw new Error('WebGL2를 사용할 수 없습니다');
      this.gl = gl;
      const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      this.prog = prog;

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

      this.u = {};
      for (const n of ['u_tex', 'u_res', 'u_ca', 'u_flash', 'u_zoom', 'u_glitch', 'u_grain', 'u_vig', 'u_seed', 'u_dir']) {
        this.u[n] = gl.getUniformLocation(prog, n);
      }
      gl.viewport(0, 0, w, h);
    }

    render(src, fx, t) {
      const gl = this.gl;
      const u = this.u;
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.uniform1i(u.u_tex, 0);
      gl.uniform2f(u.u_res, this.w, this.h);
      gl.uniform1f(u.u_ca, fx.ca);
      gl.uniform1f(u.u_flash, fx.flash);
      gl.uniform1f(u.u_zoom, fx.zoom);
      gl.uniform1f(u.u_glitch, fx.glitch);
      gl.uniform1f(u.u_grain, fx.grain);
      gl.uniform1f(u.u_vig, fx.vig);
      // 그레인은 30Hz로 갱신 — 필름 같은 질감 + 인코딩 효율
      gl.uniform1f(u.u_seed, (Math.floor(t * 30) % 997) / 997);
      gl.uniform2f(u.u_dir, fx.dir[0], fx.dir[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  window.Post = Post;
})();
