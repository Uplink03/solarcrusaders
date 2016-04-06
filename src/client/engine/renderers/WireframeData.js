var glCore = require('pixi-gl-core');

function WireframeData(gl, shader, attribsState) {
  this.gl = gl;

  this.color = [0,0,0]; // color split!

  this.points = [];
  this.indices = [];

  this.buffer = glCore.GLBuffer.createVertexBuffer(gl);
  this.indexBuffer = glCore.GLBuffer.createIndexBuffer(gl);

  this.dirty = true;

  this.glPoints = null;
  this.glIndices = null;

  this.shader = shader;

  this.vao = new glCore.VertexArrayObject(gl, attribsState)
    .addIndex(this.indexBuffer)
    .addAttribute(this.buffer, shader.attributes.aVertexPosition, gl.FLOAT, false, 4 * 6, 0)
    .addAttribute(this.buffer, shader.attributes.aColor, gl.FLOAT, false, 4 * 6, 2 * 4);
}

WireframeData.prototype.constructor = WireframeData;

WireframeData.prototype.reset = function () {
  this.points.length = 0;
  this.indices.length = 0;
};

WireframeData.prototype.upload = function () {
  this.glPoints = new Float32Array(this.points);
  this.buffer.upload( this.glPoints );

  this.glIndices = new Uint16Array(this.indices);
  this.indexBuffer.upload( this.glIndices );

  this.dirty = false;
};

WireframeData.prototype.destroy = function () {
  this.color = null;
  this.points = null;
  this.indices = null;

  this.vao.destroy();
  this.buffer.destroy();
  this.indexBuffer.destroy();

  this.gl = null;

  this.buffer = null;
  this.indexBuffer = null;

  this.glPoints = null;
  this.glIndices = null;
};

module.exports = WireframeData;
