// As described here: https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#implement-a-c-api-in-javascript
mergeInto(LibraryManager.library, {
    return_image_callback: function(width, height, data) {
        // Requires this handler function to be defined. Defining it is the responsibility
        // of whoever calls into the aruco-meta-marker-tracker WASM.
        Module._return_image_callback(width, height, data);
    }
});