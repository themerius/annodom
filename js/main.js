// This is the main entrypoint for `AnnoDom`.
// It will setup several things, like the checkboxes for every annotation layer.
// It will also call `AnnoDom` so that it can do it's magic.
// For a complete and self containing example see the [example.html](example.html)!
// For the documentation of the core algorithm see [annodom.html](annodom.html).


// Provide the global configurations for Require.js.
require.config({
  paths: {
    "jquery": "../bower_components/jquery/dist/jquery",
    "bootstrap": "../bower_components/bootstrap/dist/js/bootstrap"
  },
  shim: {
    "bootstrap": {
      deps: ["jquery"],
      exports: "bootstrap"
    }
  }
});


// Make `jquery` and `annodom` available for the main function.
require(["jquery", "annodom", "bootstrap"], function ($, annotate, bs) {

  // Colors based on Fraunhofer CD-Manual's Color Number.
  var colors = [
    "rgba(109,191,169,0.5)",  // 27
    "rgba(144,133,186,0.5)",  // 7
    "rgba(209,221,130,0.5)",  // 22
    "rgba(136,188,226,0.5)",  // 2
    "rgba(251,203,140,0.5)",  // 14
    "rgba(203,175,115,0.5)",  // 30
    "rgba( 37,186,226,0.5)",  // 34
    "rgba(255,243,129,0.5)"   // 18
  ].reverse();

  // This helper function transforms DOM identifier to a format `jquery` or `querySelector` can understand.
  var mkValidCssId = function(id) {
    return id.replace(/\//g, "\\/").replace(/:/g, "\\:").replace(/\u0040/g, "\\\u0040").replace(/\./g, "\\.").replace(/-/g, "\\-");
  }

  // Create all annotations for a chosen layer with a color.
  // Note: Currently the annotation data is retrieved from *AnnoDom's global namespace*!
  var annotateLayer = function (layerId, color) {

    if (layerId.startsWith("belief")) {
      console.debug("Annotation layer context is belief", annodom.annotations[layerId]);
      // TODO: show here BEL documents as marginal notes.
    } else if (layerId.startsWith("header")) {
      console.debug("Annotation layer context is header", annodom.annotations[layerId]);
      // TODO: show here a table of contents in a side bar.
    } else {
      console.debug("Annotation layer context is text-offset-based");
      for (var key in annodom.annotations[layerId]) {
        var annots = annodom.annotations[layerId][key];
        var id = "#" + mkValidCssId(key);
        for (var aIdx in annots) {
          var annot = annots[aIdx];
          var cls = "." + mkValidCssId(annot.attr);
          annotate(annot, $(id), $(id + " " + cls), color, layerId);
        }
      }
    }

  }

  // When the document has finished with rendering, setup the checkboxes for selection of the annotation layer.
  $(document).ready(function() {

    console.log("Welcome to AnnoDom - a DOM annotation JS lib.");

    // Retrieve from *AnnoDom's global namespace* the available annotation layers.
    var layerList = Object.keys(annodom.layers);

    // Create checkboxes for every annotation layer.
    // The layer checkboxes will be appended to the `#annotation-layer-checkboxes` node.
    for (var idx in layerList) {
      var layer = layerList[idx];
      var layerShortName = layer;
      if (layer.length > 24) {
        layerShortName = "~" + layer.substr(layer.length - 24);
      }
      var template = '<label class="checkbox-inline" title="' + layer + '">' +
        '<input type="checkbox" class="annotation-layer-checkbox" value="' + layer + '">' +
        layerShortName + '</label>';
      $("#annotation-layer-checkboxes").append(template);
    }

    // Setup the checkbox events for the annotation layers.
    // The `onchange` event is set on every `.annotation-layer-checkbox` checkbox-node.
    $("input:checkbox.annotation-layer-checkbox").change(function () {
      var layerId = $(this).val();
      if (this.checked) {
        console.debug("Enable annotation layer " + layerId);
        var color = colors.pop();
        $(this).parent().css("background-color", color);
        annotateLayer(layerId, color);
        $('[data-toggle="popover"]').popover();
      } else {
        console.debug("Disable annotation layer " + layerId);
        var color = $(this).parent().css("background-color");
        if (color) colors.push(color);
        $(this).parent().css("background-color", "");
        $(".annotation-layer-" + mkValidCssId(layerId)).remove();
      }
    });


  });

});
