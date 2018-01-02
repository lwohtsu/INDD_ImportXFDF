// xfdfファイルを開く
var file = File.openDialog ("Choose the file" , "*.xfdf", false );
if(file==null) exit();
file.open("r");
var xfdftext = file.read();
// XMLオブジェクト生成
var xfdfxml = new XML(xfdftext);

var doc = app.activeDocument;
// 注釈レイヤーがなければ追加
var annolayer = doc.layers.itemByName("注釈");
if(annolayer == null){
  annolyaer = doc.layers.add();
  annolyaer.name = "注釈";
}
// 注釈オブジェクトスタイルがなければ追加
var annostyle = doc.objectStyles.itemByName("annotation");
var parastyle = doc.paragraphStyles.itemByName("annotation");
if(annostyle == null){
  annostyle = doc.objectStyles.add();
  annostyle.name = "annotation";
  parastyle = doc.paragraphStyles.add();
  parastyle.name = "annotation";
}
parastyle.pointSize = "8Q";
parastyle.leading = 8.5; //行送り
annostyle.appliedParagraphStyle = parastyle;
annostyle.enableParagraphStyle = true;
annostyle.fillColor = "C=0 M=0 Y=100 K=0";
annostyle.enableFill = true;
annostyle.fillTransparencySettings.blendingSettings.opacity = 50;

// XMLを解読
var annots = xfdfxml.child(0).elements();
for(var i=0; i < annots.length(); i++){
  // ページ取得
  var page = annots[i].attribute("page");
  page = parseInt(page);
  // フレーム作成
  var rect = annots[i].attribute("rect").toString().split(",");
  var frame = doc.textFrames.add(
    annolayer,LocationOptions.AT_END
  );
  frame.move(doc.pages.item(page));

  // 単位変換（in to mm）
  var pagebounds = doc.pages.item(page).bounds;
  // スプレッドでずらす
  if(page > 0 && page % 2 == 0){
    var offset = pagebounds[1];
  } else {
    var offset = 0;
  }
  var indRect = [
    pagebounds[2] - parseFloat(rect[3])/2.875 - 1,//1mmの補正は謎
    parseFloat(rect[0])/2.875 + offset + 1,
    pagebounds[2] - parseFloat(rect[1])/2.875 - 1,
    parseFloat(rect[2])/2.875 + offset + 1
  ];
  frame.geometricBounds = indRect;
  frame.appliedObjectStyle = annostyle;

  switch(annots[i].localName()){
    case "text":
      setContent(frame, annots[i]);
      break;
    case "highlight":
      break;
    case "ink":
      break;
    case "freetext":
      setContent(frame, annots[i]);
      break;
    case "strikeout":
      frame.fillColor = "C=0 M=100 Y=0 K=0";
      break;
    case "caret":
      setContent(frame, annots[i]);
      break;
    case "square":
      break;
  }
}

alert("Complete");

// XMLオブジェクト内のテキストをテキストフレームにセット
function setContent(frame, annot){
  frame.contents = getChildText(annot, "");
  if(frame.overflows == true){
    frame.fit(FitOptions.FRAME_TO_CONTENT);
  }
}

// XMLオブジェクトからテキストを抽出
function getChildText(parent, text){
  if(parent.localName().indexOf("default")>=0) return text;
  var elems = parent.elements();
  text += parent.text();
  for(var i=0; i<elems.length(); i++){
    text = getChildText(elems[i], text);
  }
  return text;
}
