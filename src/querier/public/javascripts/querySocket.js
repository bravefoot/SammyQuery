var socket = io.connect();

socket.on("statusMessage", function(msg){
    var statusEle = document.createElement("p").appendChild(document.createTextNode(msg));
    var statusDiv = document.getElementById("status");
    statusDiv.insertBefore(document.createElement("br"), statusDiv.childNodes[0]);
    statusDiv.insertBefore(statusEle, statusDiv.childNodes[0]);
});

var submitQuery = function(){
    socket.emit('query',document.getElementsByName('query')[0].value);
}