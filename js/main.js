$(function() {

  sessionStorage.clear();

  var scale = 0.4; // 縦横を40%縮小
  var svgpath = [];
  var svgpath2 = [];
  var svgCanPath = [];
  var imgData;
  var clipNo = 0;
  var canDatas = [];



  var minX = null;
  var minY = null;
  var maxX = null;
  var maxY = null;

  var canvas_mouse_event_m = false; //スイッチ [ true=線を引く, false=線は引かない ]  ＊＊＊
  var canvas_mouse_event_t = false; //スイッチ [ true=線を引く, false=線は引かない ]  ＊＊＊
  var txy = 10; //iPadなどは15＋すると良いかも
  var oldXm = 0; //１つ前の座標を代入するための変数
  var oldYm = 0; //１つ前の座標を代入するための変数
  var oldXt = 0; //１つ前の座標を代入するための変数
  var oldYt = 0; //１つ前の座標を代入するための変数

  var bold_line = 10; //ラインの太さをここで指定
  var color = "#FFF"; //ラインの色をここで指定

  $('#fullpage').fullpage({
    anchors: ['firstPage', 'secondPage', '3rdPage']
  });

  $("#header li").on('click', pageChange);
  $("#imgselectdiv").on('click', fireInputEvent);
  $("#downloadImgbtn").on('click', downloadImg);
  $("#saveImgbtn").on('click', saveImg);

  //sessionstrage
  for (var i = 0; i < 100; i++) {
    var clipcansrc = sessionStorage.getItem("clipcan"+i);

    if (clipcansrc != null) {
      var newcan = $('<canvas id="clipcan' + i + '"></canvas>');
      $("#clipcanarea").append(newcan);
      var clipcan = $('#clipcan' + i)[0];
      var clipctx = clipcan.getContext("2d");

      //TODO imageを同期的にロードする！！
      var img = new Image();
      img.onload = function() {
        clipcan.width = this.width;
        clipcan.height = this.height;
        clipctx.drawImage(this, 0, 0, this.width, this.height, 0, 0, this.width, this.width);
        draggable(clipcan, clipcan);
      }
      img.src = clipcansrc;
    } else {
      break;
    }
  }

  function fireInputEvent() {
    $('#input_getFile').trigger('click');
  };


  function pageChange() {
    var page = $(this).attr("id");
    $.fn.fullpage.moveTo(page);
  };

  //canvas Setting
  var can = $('#can')[0];
  var ctx = can.getContext("2d");

  $(can).on("mousedown", function(e) {
    oldXm = e.offsetX;
    oldYm = e.offsetY - txy;
    canvas_mouse_event_m = true;
  });

  $(can).on("mousemove", function(e) {
    if (canvas_mouse_event_m == true) {
      var px = e.offsetX;
      var py = e.offsetY - txy;

      if (minX == null) {
        // first
        minX = px;
        maxX = px;
        minY = py;
        maxY = py;
      } else {
        if (minX > px) {
          minX = px;
        } else if (maxX < px) {
          maxX = px;
        }
        if (minY > py) {
          minY = py;
        } else if (maxY < py) {
          maxY = py;
        }
      }

      var point = px + "px " + py + "px";
      var clip = {
        px,
        py
      };
      svgpath.push(point);
      svgCanPath.push(clip);

      //draw line
      ctx.strokeStyle = color;
      ctx.lineWidth = bold_line;
      ctx.beginPath();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.moveTo(oldXm, oldYm);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.closePath();
      oldXm = px;
      oldYm = py;
    };
  });
  $(can).on("mouseup", function(e) {
    canvas_mouse_event_m = false;

    ctx.clearRect(0, 0, can.width, can.height);
    ctx.putImageData(imgData, 0, 0);

    var newcan = $('<canvas id="clipcan' + clipNo + '"></canvas>');
    $("#clipcanarea").append(newcan);
    var clipcan = $('#clipcan' + clipNo)[0];
    var clipctx = clipcan.getContext("2d");
    clipcan.width = maxX - minX;
    clipcan.height = maxY - minY;

    var img02 = ctx.getImageData(minX, minY, clipcan.width, clipcan.height);

    for (var i = 1; i < svgCanPath.length; i++) {
      var clipPont = (svgCanPath[i].px - minX) + "px " + (svgCanPath[i].py - minY) + "px";
      svgpath2.push(clipPont);
    }

    clipctx.putImageData(img02, 0, 0);

    //No,画像データ,パス,
    canDatas.push([clipNo,img02,svgpath2]);

    draggable(clipcan, clipcan);

    //css
    var cssval = "polygon(" + svgpath2.join() + ")";
    $('#clipcan' + clipNo).css('-webkit-clip-path', cssval);
    $('#clipcan' + clipNo).css('clip-path', cssval);

    clipNo = clipNo + 1;
    svgpath = [];
    svgpath2 = [];
    svgCanPath = [];
    minX = null;
    cssval = null;

    $.fn.fullpage.moveTo(3);
  });

  $(can).on("mouseout", function(e) {
    canvas_mouse_event_m = false;
  });


  //Event
  $('#input_getFile').on('change', file_get);

  function file_get(imgfile) {
    if (!imgfile.target.files.length) return;
    var fr = new FileReader();
    fr.onload = function(event) {
      var img = new Image();
      img.onload = function() {
        var dstWidth = this.width * scale;
        var dstHeight = this.height * scale
        can.width = dstWidth;
        can.height = dstHeight;
        ctx.drawImage(this, 0, 0, this.width, this.height, 0, 0, dstWidth, dstHeight);
        imgData = ctx.getImageData(0, 0, can.width, can.height);
        $.fn.fullpage.moveTo(2);
      }
      img.src = event.target.result;
    }
    fr.readAsDataURL(imgfile.target.files[0]);
  };

  // canvas
  var isMouseDown = false;
  var offsetX, offsetY;
  var cont;

  function draggable(handle, container) {
    container.style.position = "absolute";
    handle.onmousedown = function(event) {
      event.preventDefault();
      var rect = container.getBoundingClientRect();
      offsetX = event.screenX - rect.left;
      offsetY = event.screenY - rect.top;
      cont = container;
      isMouseDown = true;
    }
    document.onmouseup = function() {
      isMouseDown = false;
    }
    document.onmousemove = function(event) {
      if (isMouseDown == true) {
        cont.style.left = event.screenX - offsetX + "px";
        cont.style.top = event.screenY - offsetY + "px";
      }
    }
  }

  //Save
  function saveImg() {
    var canvasele = $("canvas");
    jQuery.each(canvasele, function() {
      if ($(this).attr("id") != "can") {
        sessionStorage.setItem($(this).attr("id"), this.toDataURL('image/png'));
      }
    });

  }

  //Download
  //TODO 背景画像を反映させる！！
  function downloadImg() {
    var html2obj = html2canvas($('#clipcanarea')[0]);
    var queue = html2obj.parse();
    var canvas = html2obj.render(queue);
    var img = canvas.toDataURL();
    window.open(img);
  }

});
