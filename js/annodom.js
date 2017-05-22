// With this library you can create colored hovering text annotations on text.
// It is offset based, so it is ideal for representing text mining results.

// Each annotation is a simple `<div>` which is placed into a container node.
// You give offsets to the algorithm and the browser will calculate the graphical positions with it's [`DOM` model](https://en.wikipedia.org/wiki/Document_Object_Model).

// This libary uses `jquery`, so import it as variable `$`.
define(["jquery"], function ($) {

    // Example inputs are:
    //
    //     textPos = {
    //        "begin": 6,
    //        "end": 10,
    //        "attr": "sentence",
    //        "ref": "concept/ipsum"
    //     }
    //     containerNode = $("#s1")
    //     textNode = $("#s1 .sentence")
    //     color = "rgba(109,191,169,0.5)"
    //     layer = "layer-l1"
    //
    // Example HTML markup:
    //
    //     <span id="s1">
    //       <!-- The annotation <div>'s will be placed here -->
    //       <span class="sentence">Lorem ipsum dolor</span>
    //     </span>
    function annotate(textPos, containerNode, textNode, color, layer) {

      // Collect the annotation position informations here.
      var annotationInfos = [];
      var info = iannotate(textPos, containerNode, textNode, color, layer);
      if (info) {
        annotationInfos.push(info);
      }

      // Inner recursive function which does the actual work.
      function iannotate(textPos, containerNode, textNode, color, layer) {
        var begin = textPos.begin;
        var end = textPos.end;
        var delta = textPos.end - textPos.begin;

        var textNode = $(textNode).get(0); // get raw dom element from jquery
        var innerTextNode = textNode.firstChild;
        var innerTextNodeCopy = innerTextNode.textContent;

        // Splitting the text with [Text.splitText API](https://developer.mozilla.org/en-US/docs/Web/API/Text.splitText) into head, middle and tail nodes.
        var headNode = undefined
        if (begin > innerTextNode.textContent.length) {
          console.error("Offset Error (@head)!", textPos, textNode);
          return {};
        } else {
          headNode = innerTextNode.splitText(begin);
        }
        var middleNode = innerTextNode.nextSibling;
        var tailNode = undefined;
        if (delta > middleNode.textContent.length) {
          console.error("Offset Error (@tail)!", textPos, textNode);
          tailNode = middleNode.splitText(middleNode.textContent.length);
          color = "red";
        } else {
          tailNode = middleNode.splitText(delta);
        }

        // Create a temporary node, with a copy of the text of the middle node.
        var tmp = document.createElement("span");
        tmp.appendChild(document.createTextNode(middleNode.textContent));

        // Place the temporary node at the position of the middle node.
        // Why this? Because the browser hasn't calculated any graphical postions for middle node yet. With this temporary node we force the browser to re-render and generate the graphical informations for the temporary node. Maybe there are far better solutions...
        var replacedNode = textNode.replaceChild(tmp, middleNode);

        // Retrieve the graphical position, line height and surrounding box of the temporary (middle) node.
        // These informations where calculated by the browsers render engine.
        var position = $(tmp).position();
        var lineheight = parseFloat( $(textNode).css("line-height") );
        var box = { width: $(tmp).width(), height: $(tmp).height() };

        if (isNaN(lineheight)) {
          console.error("Line height is not a number. " +
          "Please set a numeric line-height CSS style. " +
          "Otherwise it can cause corrupt annotations on line breaks.");
        }

        // Some conditions...
        var voidBox = box.width == 0;
        var foundLineBreak = box.height > (1.5 * lineheight);
        var foundSingleCharWithHypen = middleNode.length == 1 && foundLineBreak;

        if (foundSingleCharWithHypen) {
          // It's one char, which is assigned to two lines.
          // This means that the browser has appended a hyphen to this single char (to the `middleNode`)!
          position.top += lineheight;
          box.height -= lineheight;

          var forMeasure = document.createElement("span");
          forMeasure.innerHTML = middleNode.textContent;
          containerNode.append(forMeasure);
          box.width = $(forMeasure).width();
          $(forMeasure).remove();

          createAnnotation(containerNode, position, box, color, layer, textPos);

          // Reset text-state for further annotations.
          $(textNode).text(innerTextNodeCopy);

          return {
            "containerNode": containerNode,
            "position": position,
            "box": box,
            "color": color,
            "model": textPos
          };
        } else if (voidBox) {
          // Note: This case arose from some [Bootstrap](http://getbootstrap.com/) CSS rules...
          // No successful annotation possible, so reset text-state.
          $(textNode).text(innerTextNodeCopy);
          return {};
        } else if (foundLineBreak) {
          // No successful annotation possible, reset text-state.
          $(textNode).text(innerTextNodeCopy);
          // Divide the problem.
          var left = {begin: begin, end: begin + Math.ceil(delta / 2)};
          var right = {begin: begin + Math.ceil(delta / 2), end: end};
          // Split the annotation at the line break into litte peaces and call again the algorithm.
          iannotate(left, containerNode, textNode, color, layer);
          iannotate(right, containerNode, textNode, color, layer);
        } else {
          // Simply create a normal annotation.
          createAnnotation(containerNode, position, box, color, layer, textPos);
          // Reset text-state for further annotations.
          $(textNode).text(innerTextNodeCopy);

          return {
            "containerNode": containerNode,
            "position": position,
            "box": box,
            "color": color,
            "model": textPos
          };
        }
      }

      return annotationInfos;
    }

    // This function creates a hovering annotation box.
    // The annotation can be colored and assigned to a annotation layer.
    // To identify all annotations use for example `$(".annotated")` or
    // if you want only annotations in a certain layer use for example `$(".annotation-layer-LAYERNAME")`.
    function createAnnotation(containerNode, position, box, color, layer, model) {
      var annot = $(document.createElement("div"));
      annot.addClass("annotated");
      annot.attr("data-toggle", "popover");
      annot.attr("data-placement", "top");
      annot.attr("data-html", "true");
      annot.attr("data-content", "<a href='/§:" + model.ref + "'>" + model.ref + "</a>");
      annot.attr("data-trigger", "focus");  // needed for dismiss-on-next-click
      annot.attr("role", "button"); // needed for dismiss-on-next-click
      annot.attr("tabindex", "0"); // needed for dismiss-on-next-click
      if (layer)
        annot.addClass("annotation-layer-" + layer);
      annot.css( "width", box.width );
      annot.css( "height", "0.3em" );
      annot.css( "left", position.left );
      annot.css( "top", position.top + box.height - 3 );
      if (color)
        annot.css( "background-color", color);
      containerNode.prepend(annot);
    }

    // Expose the entry function.
    return annotate;

});
