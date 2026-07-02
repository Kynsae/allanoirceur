import { afterNextRender, Component, ElementRef, input, OnDestroy, ViewChild } from '@angular/core';

type ReleaseShaderState = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  texture: WebGLTexture;
  positionLocation: number;
  progressLocation: WebGLUniformLocation;
  resolutionLocation: WebGLUniformLocation;
  timeLocation: WebGLUniformLocation;
  imageSizeLocation: WebGLUniformLocation;
  textureLocation: WebGLUniformLocation;
  imageWidth: number;
  imageHeight: number;
  frameId: number | null;
  startTime: number;
};

@Component({
  selector: 'app-release-cover-shader',
  imports: [],
  templateUrl: './release-cover-shader.html',
  styleUrl: './release-cover-shader.scss',
})
export class ReleaseCoverShader implements OnDestroy {
  @ViewChild('shaderCanvas')
  private readonly shaderCanvas?: ElementRef<HTMLCanvasElement>;

  @ViewChild('coverStack')
  private readonly coverStack?: ElementRef<HTMLDivElement>;

  public readonly imageSrc = input.required<string>();
  public readonly imageAlt = input<string>('');
  public readonly progress = input(0);

  private releaseShaderState: ReleaseShaderState | null = null;
  private readonly handleWindowResize = () => this.resizeShader();
  public shaderReady = false;

  constructor() {
    afterNextRender(() => {
      this.setupShader();
    });
  }

  ngOnDestroy(): void {
    this.teardownShader();
  }

  private setupShader(): void {
    const canvas = this.shaderCanvas?.nativeElement;
    const coverStack = this.coverStack?.nativeElement;

    if (!canvas || !coverStack) {
      return;
    }

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });

    if (!gl) {
      return;
    }

    const program = this.createShaderProgram(gl);

    if (!program) {
      return;
    }

    const buffer = gl.createBuffer();
    const texture = gl.createTexture();

    if (!buffer || !texture) {
      gl.deleteProgram(program);
      return;
    }

    const positionLocation = gl.getAttribLocation(program, 'aPosition');
    const progressLocation = gl.getUniformLocation(program, 'uProgress');
    const resolutionLocation = gl.getUniformLocation(program, 'uResolution');
    const timeLocation = gl.getUniformLocation(program, 'uTime');
    const imageSizeLocation = gl.getUniformLocation(program, 'uImageSize');
    const textureLocation = gl.getUniformLocation(program, 'uTexture');

    if (
      positionLocation === -1 ||
      !progressLocation ||
      !resolutionLocation ||
      !timeLocation ||
      !imageSizeLocation ||
      !textureLocation
    ) {
      gl.deleteBuffer(buffer);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW,
    );

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.releaseShaderState = {
      gl,
      program,
      buffer,
      texture,
      positionLocation,
      progressLocation,
      resolutionLocation,
      timeLocation,
      imageSizeLocation,
      textureLocation,
      imageWidth: 1,
      imageHeight: 1,
      frameId: null,
      startTime: performance.now(),
    };

    const image = new Image();
    image.decoding = 'async';

    image.onload = () => {
      const state = this.releaseShaderState;

      if (!state) {
        return;
      }

      state.imageWidth = image.naturalWidth || image.width || 1;
      state.imageHeight = image.naturalHeight || image.height || 1;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      this.shaderReady = true;
      this.resizeShader();
      this.renderShader();
    };

    image.onerror = () => {
      this.teardownShader();
    };

    image.src = this.imageSrc();
    window.addEventListener('resize', this.handleWindowResize);
  }

  private resizeShader(): void {
    const canvas = this.shaderCanvas?.nativeElement;
    const coverStack = this.coverStack?.nativeElement;

    if (!canvas || !coverStack) {
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(coverStack.clientWidth * pixelRatio));
    const height = Math.max(1, Math.floor(coverStack.clientHeight * pixelRatio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  private renderShader = (): void => {
    const state = this.releaseShaderState;
    const canvas = this.shaderCanvas?.nativeElement;

    if (!state || !canvas || !this.shaderReady) {
      return;
    }

    this.resizeShader();

    const { gl } = state;
    const elapsed = (performance.now() - state.startTime) * 0.001;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(state.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, state.buffer);
    gl.enableVertexAttribArray(state.positionLocation);
    gl.vertexAttribPointer(state.positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, state.texture);
    gl.uniform1i(state.textureLocation, 0);
    gl.uniform1f(state.progressLocation, this.progress());
    gl.uniform2f(state.resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(state.timeLocation, elapsed);
    gl.uniform2f(state.imageSizeLocation, state.imageWidth, state.imageHeight);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    state.frameId = window.requestAnimationFrame(this.renderShader);
  };

  private teardownShader(): void {
    window.removeEventListener('resize', this.handleWindowResize);

    if (!this.releaseShaderState) {
      return;
    }

    if (this.releaseShaderState.frameId !== null) {
      window.cancelAnimationFrame(this.releaseShaderState.frameId);
    }

    const { gl, buffer, texture, program } = this.releaseShaderState;

    gl.deleteBuffer(buffer);
    gl.deleteTexture(texture);
    gl.deleteProgram(program);

    this.releaseShaderState = null;
    this.shaderReady = false;
  }

  private createShaderProgram(gl: WebGLRenderingContext): WebGLProgram | null {
    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, `
      attribute vec2 aPosition;
      varying vec2 vUv;

      void main() {
        vUv = aPosition * 0.5 + 0.5;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `);

    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;

      varying vec2 vUv;

      uniform sampler2D uTexture;
      uniform vec2 uResolution;
      uniform vec2 uImageSize;
      uniform float uProgress;
      uniform float uTime;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      vec2 coverUv(vec2 uv, vec2 container, vec2 image) {
        float containerRatio = container.x / container.y;
        float imageRatio = image.x / image.y;
        vec2 scale = vec2(1.0);
        vec2 offset = vec2(0.0);

        if (containerRatio > imageRatio) {
          scale.y = imageRatio / containerRatio;
          offset.y = (1.0 - scale.y) * 0.5;
        } else {
          scale.x = containerRatio / imageRatio;
          offset.x = (1.0 - scale.x) * 0.5;
        }

        return offset + uv * scale;
      }

      void main() {
        float progress = clamp(uProgress, 0.0, 1.0);
        float topToBottom = 1.0 - vUv.y;
        float noiseField = noise(vec2(vUv.x * 9.0, topToBottom * 24.0 + uTime * 0.45));
        float scanNoise = noise(vec2(vUv.x * 25.0 + uTime * 0.15, topToBottom * 90.0));
        float edgeJitter = (noiseField - 0.5) * (0.12 - progress * 0.07);
        float frontier = clamp(progress + edgeJitter, 0.0, 1.12);
        float alpha = (1.0 - smoothstep(frontier - 0.07, frontier + 0.01, topToBottom)) * step(0.001, progress);

        if (alpha <= 0.001) {
          discard;
        }

        float band = smoothstep(0.24, 0.0, abs(topToBottom - frontier));
        float aberration = band * (1.0 - progress);
        float horizontalWarp = sin(topToBottom * 45.0 + uTime * 3.2) * 0.005 * aberration;
        horizontalWarp += (scanNoise - 0.5) * 0.02 * aberration;
        float redShift = 0.045 * aberration;
        float cyanShift = 0.03 * aberration;

        vec2 textureUv = coverUv(vec2(vUv.x + horizontalWarp, vUv.y), uResolution, uImageSize);
        vec2 redUv = clamp(textureUv + vec2(-redShift, 0.0), 0.0, 1.0);
        vec2 cyanUv = clamp(textureUv + vec2(cyanShift, 0.0), 0.0, 1.0);
        vec2 greenUv = clamp(textureUv + vec2(horizontalWarp * 0.5, 0.0), 0.0, 1.0);

        vec4 redSample = texture2D(uTexture, redUv);
        vec4 greenSample = texture2D(uTexture, greenUv);
        vec4 cyanSample = texture2D(uTexture, cyanUv);

        vec3 color = vec3(redSample.r, greenSample.g, cyanSample.b);
        float glow = band * (0.15 + 0.2 * (1.0 - progress));
        color += vec3(0.12, 0.02, 0.02) * glow;
        color += vec3(0.02, 0.05, 0.12) * glow;

        gl_FragColor = vec4(color, alpha);
      }
    `);

    if (!vertexShader || !fragmentShader) {
      if (vertexShader) {
        gl.deleteShader(vertexShader);
      }

      if (fragmentShader) {
        gl.deleteShader(fragmentShader);
      }

      return null;
    }

    const program = gl.createProgram();

    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  private compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string,
  ): WebGLShader | null {
    const shader = gl.createShader(type);

    if (!shader) {
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }
}
