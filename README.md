Tectonic.js
-----------

[![Build Status](https://travis-ci.org/tecknack/tectonic.svg?branch=master)](https://travis-ci.org/tecknack/tectonic)
[![NPM](https://img.shields.io/npm/v/tectonic.js.svg)](https://www.npmjs.com/package/tectonic.js)

Tectonic is a functional rendering engine for DOM nodes, heavily inspired by
Beebole’s PURE rendering engine. It ascribes to PURE’s unobtusive philosophy,
whereby HTML code is completely free of any application logic or new syntax and
JavaScript code is uninhibited by presentational concerns. This is achieved by
both PURE and Tectonic by the use of a directive object that marries the DOM
referenced by CSS selectors to properties in your application’s data. Where
Tectonic departs from PURE is in the use of functions, known as renderers, to
directly manipulate DOM nodes. This permits Tectonic to provide two-way data
flow via a parse method, which makes use of an inverse function that is attached
to a renderer.

For more information visit [http://tecknack.github.io/tectonic](http://tecknack.github.io/tectonic/)
