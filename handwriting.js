var canvasWidth=Math.min(800,$(window).width()-20)
var canvasHeight=canvasWidth
var socket = io.connect('ws://58.210.84.138:8090');
var strokeColor="black"
var isMouseDown=false
var lastLoc={x:0,y:0}
var lastTimestamp=0
var lastLineWidth=-1


var canvas=document.getElementById("canvas")
var context=canvas.getContext("2d")

canvas.width=canvasWidth
canvas.height=canvasHeight

$("#controller").css("width",canvasWidth+'px')
drawGrid()
$("#clear_btn").click(function(e){
	socket.emit('clear',{})
	context.clearRect(0,0,canvasWidth,canvasHeight)
	drawGrid()
})

$(".color_btn").click(function(e){
	$(".color_btn").removeClass("color_btn_selected")
	$(this).addClass("color_btn_selected")
	strokeColor=$(this).css("background-color")
	socket.emit('color',strokeColor)
})

function beginStroke(point)
{
	isMouseDown=true;
	//console.log("mouse down")
	//console.log(e)
	//console.log('x:'+e.clientX+',y:'+e.clientY)
	lastLoc=point
	lastTimestamp=new Date().getTime();
	//alert(loc.x+','+loc.y)
}
function endStroke()
{
	isMouseDown=false;
}

function RelativePoint(msg)
{
	var point=msg.point;
	var bc=msg.bc;
	return {x:Math.round(point.x*canvasWidth/bc),y:Math.round(point.y*canvasHeight/bc)}
}

function moveStroke(point)
{
	//console.log("mouse move")
	var curLoc=point;
	var curTimestamp=new Date().getTime();
	var s= calcDistance(curLoc,lastLoc);
	var t=curTimestamp-lastTimestamp;

	var lineWidth=calcLineWidth(t,s);

	//draw
	context.beginPath();
	context.moveTo(lastLoc.x,lastLoc.y);
	context.lineTo(curLoc.x,curLoc.y);

	context.strokeStyle=strokeColor
	context.lineWidth=lineWidth
	context.lineCap='round'
	context.lineJoin='round'
	context.stroke()

	lastLoc=curLoc;
	lastTimestamp=curTimestamp;
	lastLineWidth=lineWidth;
}

canvas.onmousedown=function(e)
{
	e.preventDefault();//取消事件的默认动作。
	var point=windowToCanvas(e.clientX,e.clientY)
	beginStroke(point)
	socket.emit('img',{point:point,bc:canvasWidth})
};

canvas.onmouseup=function(e)
{
	e.preventDefault();
	endStroke()
	console.log("mouse up")
};

canvas.onmouseout=function(e)
{
	e.preventDefault();
	endStroke()
	console.log("mouse out")
};

canvas.onmousemove=function(e)
{
	e.preventDefault();
	if(isMouseDown)
	{
		var point=windowToCanvas(e.clientX,e.clientY)
		moveStroke(point)
		socket.emit('path',{point:point,bc:canvasWidth})
	}
};
socket.on('path',function(msg){
	moveStroke(RelativePoint(msg))
})

socket.on('img',function(msg){
	beginStroke(RelativePoint(msg))
})
socket.on('clear',function(msg){
	context.clearRect(0,0,canvasWidth,canvasHeight)
	drawGrid()
})
socket.on('color',function(msg){
	$(".color_btn").removeClass("color_btn_selected")
	var btns=$(".color_btn");
	for(var i=0;i<btns.length;i++)
	{
		if($(".color_btn:eq("+i+")").css("background-color")==msg)
		{
			$(".color_btn:eq("+i+")").addClass("color_btn_selected")
		}
	}
	strokeColor=msg
})

canvas.addEventListener('touchstart',function(e){
	e.preventDefault()
	touch=e.touches[0]
	var point=windowToCanvas(touch.pageX,touch.pageY)
	beginStroke(point)
	socket.emit('img',{point:point,bc:canvasWidth})
})

canvas.addEventListener('touchmove',function(e){
	e.preventDefault()
	if(isMouseDown)
	{
		touch=e.touches[0]
		var point=windowToCanvas(touch.pageX,touch.pageY)
		moveStroke(point)
		socket.emit('path',{point:point,bc:canvasWidth})
	}
})

canvas.addEventListener('touchend',function(e){
	e.preventDefault()
	endStroke()
})


function calcDistance(loc1,loc2)
{
	return Math.sqrt((loc1.x-loc2.x)*(loc1.x-loc2.x)+(loc1.y-loc2.y)*(loc1.y-loc2.y))
}

var maxLineWidth=30
var minLineWidth=1
var maxStrokeV=10
var minStrokeV=0.1

function calcLineWidth(t,s){
	var v=s/t
	var resultLineWidth
	if(v<=minStrokeV)
		resultLineWidth=maxLineWidth
	else if(v>=maxStrokeV)
		resultLineWidth=minLineWidth
	else
		resultLineWidth=maxLineWidth-(v-minStrokeV)/(maxStrokeV-minStrokeV)*(maxLineWidth-minLineWidth)

	if(lastLineWidth==-1)
		return resultLineWidth

	return lastLineWidth*2/3+resultLineWidth*1/3
}

function windowToCanvas(x,y){
	var bbox=canvas.getBoundingClientRect()
	return {x:Math.round(x-bbox.left),y:Math.round(y-bbox.top)}
}

function drawGrid(){
	context.save()

	context.strokeStyle="rgb(320,11,9)"

	context.beginPath()
	context.moveTo(3,3)
	context.lineTo(canvasWidth-3,3)
	context.lineTo(canvasWidth-3,canvasHeight-3)
	context.lineTo(3,canvasHeight-3)
	context.closePath()

	context.lineWidth=6
	context.stroke()

	context.beginPath()
	context.moveTo(0,0)
	context.lineTo(canvasWidth,canvasHeight)

	context.moveTo(canvasWidth,0)
	context.lineTo(0,canvasHeight)

	context.moveTo(canvasWidth/2,0)
	context.lineTo(canvasWidth/2,canvasHeight)

	context.moveTo(0,canvasHeight/2)
	context.lineTo(canvasWidth,canvasHeight/2)

	context.lineWidth=1
	context.setLineDash([25,5])
	context.stroke()

	context.restore()
}