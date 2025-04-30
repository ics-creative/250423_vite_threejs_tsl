import{M as b,O as E,B as P,F as w,S as _,U as A,V as g,W as D,H as L,N as k,C as U,a as M,b as T,s as r,c as y,d as z,e as c,f as B,g as F,u as I}from"./scene-Da_MCtHd.js";const K={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class d{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const N=new E(-1,1,1,-1,0,1);class j extends P{constructor(){super(),this.setAttribute("position",new w([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new w([0,2,0,0,2,0],2))}}const O=new j;class Q{constructor(e){this._mesh=new b(O,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,N)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class S extends d{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof _?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=A.clone(e.uniforms),this.material=new _({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new Q(this.material)}render(e,t,a){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=a.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class x extends d{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,a){const i=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let o,f;this.inverse?(o=0,f=1):(o=1,f=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),s.buffers.stencil.setFunc(i.ALWAYS,o,4294967295),s.buffers.stencil.setClear(f),s.buffers.stencil.setLocked(!0),e.setRenderTarget(a),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(i.EQUAL,1,4294967295),s.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),s.buffers.stencil.setLocked(!0)}}class W extends d{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class H{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const a=e.getSize(new g);this._width=a.width,this._height=a.height,t=new D(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:L}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new S(K),this.copyPass.material.blending=k,this.clock=new U}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let a=!1;for(let i=0,s=this.passes.length;i<s;i++){const o=this.passes[i];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),o.render(this.renderer,this.writeBuffer,this.readBuffer,e,a),o.needsSwap){if(a){const f=this.renderer.getContext(),v=this.renderer.state.buffers.stencil;v.setFunc(f.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),v.setFunc(f.EQUAL,1,4294967295)}this.swapBuffers()}x!==void 0&&(o instanceof x?a=!0:o instanceof W&&(a=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new g);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const a=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(a,i),this.renderTarget2.setSize(a,i);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(a,i)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class V extends d{constructor(e,t,a=null,i=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=a,this.clearColor=i,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new M}render(e,t,a){const i=e.autoClear;e.autoClear=!1;let s,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:a),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),e.autoClear=i}}const C=document.querySelector("#webgl");if(!C)throw new Error("Canvas element #webgl not found!");const l=new T({canvas:C,antialias:!0});l.setClearColor(0);l.setPixelRatio(window.devicePixelRatio);l.setSize(r.width,r.height);l.shadowMap.enabled=!0;const m=new y({trackGPU:!0,trackHz:!0});m.init(l);document.body.appendChild(m.dom);const n=new z(c,l.domElement);n.autoRotate=!0;n.autoRotateSpeed=1;n.maxPolarAngle=Math.PI/2*.95;n.minDistance=100;n.maxDistance=2e3;n.enableDamping=!0;n.dampingFactor=.05;B();const p=new H(l);p.addPass(new V(F,c));const G={uniforms:{tDiffuse:{value:null},focusPos:{value:.5},blurAmount:{value:7},gradientRadius:{value:.2},resolution:{value:new g(r.width,r.height)}},vertexShader:`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float focusPos;
    uniform float blurAmount;
    uniform float gradientRadius;
    uniform vec2 resolution;
    varying vec2 vUv;
    float gaussianPdf(in float x, in float sigma) {
      return 0.39894 * exp(-0.5 * x * x / (sigma * sigma)) / sigma;
    }
    void main() {
      float dist = abs(vUv.y - focusPos);
      float blurStrength = smoothstep(gradientRadius, gradientRadius + 0.2, dist) * blurAmount;
      vec4 originalColor = texture2D(tDiffuse, vUv);
      if (blurStrength < 0.1) {
        gl_FragColor = originalColor;
        return;
      }
      const int KERNEL_RADIUS = 3;
      float kernel[KERNEL_RADIUS + 1];
      vec3 final_color = vec3(0.0);
      float totalWeight = 0.0;
      float sigma = float(KERNEL_RADIUS);
      float sum = 0.0;
      for (int i = 0; i <= KERNEL_RADIUS; i++) {
        kernel[i] = gaussianPdf(float(i), sigma);
        sum += (i == 0 ? 1.0 : 2.0) * kernel[i];
      }
      for (int i = 0; i <= KERNEL_RADIUS; i++) {
        kernel[i] /= sum;
      }
      vec2 pixelSize = 1.0 / resolution;
      for (int i = -KERNEL_RADIUS; i <= KERNEL_RADIUS; i++) {
        for (int j = -KERNEL_RADIUS; j <= KERNEL_RADIUS; j++) {
          float weight = kernel[abs(i)] * kernel[abs(j)];
          vec2 offset = vec2(float(i), float(j)) * pixelSize * blurStrength;
          final_color += texture2D(tDiffuse, vUv + offset).rgb * weight;
          totalWeight += weight;
        }
      }
      gl_FragColor = vec4(final_color / totalWeight, originalColor.a);
    }
  `},u=new S(G);p.addPass(u);const R=()=>{n.update(),I(),p.render(),m.update(),window.requestAnimationFrame(R)};R();window.addEventListener("resize",q);function q(){r.width=window.innerWidth,r.height=window.innerHeight,c.aspect=r.width/r.height,c.updateProjectionMatrix(),l.setSize(r.width,r.height),l.setPixelRatio(window.devicePixelRatio),p.setSize(r.width,r.height),u&&u.uniforms.resolution&&u.uniforms.resolution.value.set(r.width,r.height)}
